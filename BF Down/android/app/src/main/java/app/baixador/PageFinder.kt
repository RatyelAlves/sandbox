package app.baixador

import android.annotation.SuppressLint
import android.graphics.BitmapFactory
import android.util.Base64
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import kotlinx.coroutines.CancellableContinuation
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONObject
import kotlin.coroutines.coroutineContext
import kotlin.coroutines.resume

class PageFinder(
    private val webView: WebView,
    private val client: OkHttpClient,
) {
    private val found = mutableListOf<String>()
    private val pictures = LinkedHashMap<String, Map<String, String>>()
    private var pageUrl: String = ""
    private var coverCont: CancellableContinuation<String>? = null

    @SuppressLint("SetJavaScriptEnabled")
    fun prepare(userAgent: String) {
        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)
        webView.addJavascriptInterface(UrlSink(::absorb, ::acceptCover), "BF")
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = true
            loadsImagesAutomatically = true
            userAgentString = userAgent
            mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }
        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
                val url = request.url?.toString().orEmpty()
                if (isStream(url)) {
                    synchronized(found) { found.add(url) }
                }
                if (isPicture(url)) {
                    synchronized(pictures) {
                        if (pictures.size < 40) pictures[url] = HashMap(request.requestHeaders)
                    }
                }
                return null
            }
        }
    }

    suspend fun find(
        url: String,
        onStatus: (String) -> Unit,
        onChallenge: (Boolean) -> Unit,
    ): MediaInfo {
        pageUrl = url
        synchronized(found) { found.clear() }
        synchronized(pictures) { pictures.clear() }
        withContext(Dispatchers.Main) {
            webView.onResume()
            webView.resumeTimers()
            webView.stopLoading()
            webView.loadUrl(url)
        }
        onStatus("Buscando o vídeo em segundo plano…")
        val started = System.currentTimeMillis()
        var deadline = started + 25_000
        var blockedNoted = false
        while (System.currentTimeMillis() < deadline && System.currentTimeMillis() < started + 90_000) {
            coroutineContext.ensureActive()
            val title = currentTitle()
            val pageBlocked = collectPageUrls() || isBlocked(title)
            val best = bestUrl()
            if (best != null && isPlaylistUrl(best)) {
                if (blockedNoted) onChallenge(false)
                onStatus("Vídeo encontrado na página.")
                break
            } else if (pageBlocked) {
                if (!blockedNoted && System.currentTimeMillis() - started > 2_000) {
                    blockedNoted = true
                    onChallenge(true)
                    onStatus("Conclui a verificação do site para continuar.")
                }
                deadline = maxOf(deadline, System.currentTimeMillis() + 20_000).coerceAtMost(started + 90_000)
            } else if (blockedNoted) {
                onChallenge(false)
            }
            delay(450)
        }
        onChallenge(false)
        val chosen = bestUrl() ?: throw IllegalStateException(
            "A página abriu, mas o player não pediu o vídeo. Confere se o link é a página do vídeo."
        )
        val userAgent = withContext(Dispatchers.Main) { webView.settings.userAgentString }
        val cookie = CookieManager.getInstance().getCookie(url).orEmpty()
        val preview = readPreview()
        withContext(Dispatchers.Main) { silence() }
        return withContext(Dispatchers.IO) {
            val headers = buildMap {
                put("User-Agent", userAgent)
                put("Referer", url)
                put("Accept", "*/*")
                if (cookie.isNotBlank()) put("Cookie", cookie)
            }
            val prefix = httpPrefix(chosen, headers, 256 * 1024)
            val prefixText = prefix.toString(Charsets.UTF_8)
            val isPlaylist = prefixText.trimStart().startsWith("#EXTM3U")
            val choices = if (isPlaylist) Playlist.variants(prefixText, chosen) else emptyList()
            val variant = choices.firstOrNull()
            val streamUrl = variant?.url ?: chosen
            val mediaText = when {
                variant != null -> httpText(streamUrl, headers)
                isPlaylist -> httpText(chosen, headers)
                else -> ""
            }
            val duration = if (mediaText.isEmpty()) 0.0 else Playlist.durationSeconds(mediaText)
            val options = choices.map { QualityOption(it.url, Playlist.choiceLabel(it, choices)) }
            val quality = options.firstOrNull()?.label.orEmpty()
            val seen = preview.imageUrls.toMutableList()
            val extra = synchronized(pictures) { pictures.keys.toList() }
                .sortedByDescending { rankPicture(it, url) }
            for (candidate in extra) {
                if (candidate !in seen) seen += candidate
            }
            val image = loadCover(seen.take(8), headers, url)
            MediaInfo(
                pageUrl = url,
                streamUrl = streamUrl,
                title = preview.title.ifBlank { "Vídeo" },
                quality = quality,
                durationSeconds = duration,
                imageBytes = image,
                userAgent = userAgent,
                cookie = cookie,
                options = options,
            )
        }
    }

    fun stop() {
        webView.stopLoading()
    }

    private suspend fun currentTitle(): String = withContext(Dispatchers.Main) {
        webView.title.orEmpty()
    }

    private suspend fun readPreview(): PreviewText = withContext(Dispatchers.Main) {
        kotlinx.coroutines.suspendCancellableCoroutine { cont ->
            webView.evaluateJavascript(
                """
                (function() {
                  function meta(sel) {
                    var el = document.querySelector(sel);
                    if (!el) return '';
                    return el.content || el.getAttribute('href') || '';
                  }
                  function abs(value) {
                    var src = String(value || '').trim();
                    if (!src || src.indexOf('data:') === 0 || src.indexOf('blob:') === 0) return '';
                    try { return new URL(src, location.href).href; } catch (e) { return ''; }
                  }
                  var ranked = [];
                  function push(value, score) {
                    var src = abs(value);
                    if (!src) return;
                    var lower = src.toLowerCase();
                    if (lower.indexOf('logo') >= 0 || lower.indexOf('favicon') >= 0 || lower.indexOf('sprite') >= 0 || lower.indexOf('emoji') >= 0 || lower.indexOf('avatar') >= 0 || lower.indexOf('1x1') >= 0) return;
                    for (var i = 0; i < ranked.length; i++) {
                      if (ranked[i].url === src) {
                        if (score > ranked[i].score) ranked[i].score = score;
                        return;
                      }
                    }
                    ranked.push({ url: src, score: score });
                  }
                  push(meta('meta[property="og:image"]'), 100);
                  push(meta('meta[property="og:image:secure_url"]'), 96);
                  push(meta('meta[name="twitter:image"]'), 92);
                  push(meta('meta[name="twitter:image:src"]'), 90);
                  push(meta('meta[property="twitter:image"]'), 90);
                  push(meta('link[rel="image_src"]'), 88);
                  var videos = document.querySelectorAll('video');
                  for (var v = 0; v < videos.length; v++) {
                    if (!videos[v].poster) continue;
                    push(videos[v].poster, videos[v].closest('a') ? 40 : 84);
                  }
                  var imgs = document.querySelectorAll('img');
                  for (var n = 0; n < imgs.length; n++) {
                    var img = imgs[n];
                    var src = img.currentSrc || img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-thumb') || img.getAttribute('data-original') || '';
                    var area = (img.naturalWidth || img.width || 0) * (img.naturalHeight || img.height || 0);
                    var score = img.closest('a') ? 12 : 55;
                    if (area >= 40000) score += 25;
                    push(src, score);
                  }
                  var styled = document.querySelectorAll('[style*="background"]');
                  for (var b = 0; b < styled.length; b++) {
                    var style = styled[b].getAttribute('style') || '';
                    var start = style.indexOf('url(');
                    if (start < 0) continue;
                    var raw = style.substring(start + 4).split(')')[0].replace(/["']/g, '').trim();
                    push(raw, styled[b].closest('a') ? 18 : 70);
                  }
                  try {
                    var entries = performance.getEntriesByType('resource');
                    for (var e = 0; e < entries.length; e++) push(entries[e].name || '', 30);
                  } catch (err) {}
                  ranked.sort(function(a, b) { return b.score - a.score; });
                  var images = [];
                  for (var k = 0; k < ranked.length && images.length < 8; k++) images.push(ranked[k].url);
                  var heading = document.querySelector('h1');
                  var og = document.querySelector('meta[property="og:title"]');
                  var title = (heading && heading.innerText) || (og && og.content) || document.title || '';
                  return JSON.stringify({ title: title, images: images });
                })();
                """.trimIndent(),
            ) { raw ->
                val parsed = runCatching {
                    val inner = JSONArray("[$raw]").getString(0)
                    val json = JSONObject(inner)
                    val images = json.optJSONArray("images")
                    val urls = mutableListOf<String>()
                    if (images != null) {
                        for (index in 0 until images.length()) {
                            val item = images.optString(index)
                            if (item.startsWith("http")) urls += item
                        }
                    }
                    PreviewText(clean(json.optString("title")), urls)
                }.getOrDefault(PreviewText(clean(webView.title.orEmpty()), emptyList()))
                if (cont.isActive) cont.resume(parsed)
            }
        }
    }

    private suspend fun collectPageUrls(): Boolean {
        val raw = withContext(Dispatchers.Main) {
            kotlinx.coroutines.suspendCancellableCoroutine { cont ->
                webView.evaluateJavascript(
                    """
                    (function() {
                      var slash = String.fromCharCode(92);
                      var text = document.documentElement ? document.documentElement.innerHTML : '';
                      text = text.split(slash + '/').join('/').split('&amp;').join('&');
                      var found = [];
                      function take(blob) {
                        var re = /https?:\/\/[^\s"'<>\\]+/g;
                        var match;
                        while ((match = re.exec(blob))) {
                          var url = match[0];
                          var lower = url.toLowerCase();
                          if (lower.indexOf('.m3u8') >= 0 || lower.indexOf('.mpd') >= 0 || lower.indexOf('.mp4') >= 0 || lower.indexOf('.webm') >= 0 || lower.indexOf('.mkv') >= 0 || lower.indexOf('.m4v') >= 0 || lower.indexOf('multi=') >= 0) {
                            found.push(url);
                            if (found.length >= 30) return;
                          }
                        }
                      }
                      take(text);
                      try {
                        var entries = performance.getEntriesByType('resource');
                        for (var n = 0; n < entries.length; n++) take(entries[n].name || '');
                      } catch (e) {}
                      if (window.BF) window.BF.report(found.join('\n'));
                      var body = '';
                      try {
                        body = (document.body && document.body.innerText ? document.body.innerText : '').slice(0, 400).toLowerCase();
                      } catch (e2) {}
                      var blocked = body.indexOf('just a moment') >= 0 || body.indexOf('attention required') >= 0 || body.indexOf('cf-browser') >= 0;
                      return (blocked ? 'blocked' : 'open') + '\n' + found.join('\n');
                    })();
                    """.trimIndent(),
                ) { value ->
                    if (cont.isActive) cont.resume(value ?: "")
                }
            }
        }
        val text = runCatching { JSONArray("[$raw]").getString(0) }.getOrDefault("")
        val lines = text.lineSequence().map { it.trim() }.filter { it.isNotEmpty() }.toList()
        for (line in lines.drop(1)) {
            if (line.startsWith("http")) addUrl(line)
        }
        return lines.firstOrNull()?.startsWith("blocked") == true
    }

    private fun absorb(payload: String) {
        extractUrls(unescape(payload)).forEach { addUrl(it) }
    }

    private fun unescape(text: String): String {
        return text.replace("\\/", "/")
            .replace("\\u002F", "/")
            .replace("\\u002f", "/")
            .replace("\\u0026", "&")
            .replace("&amp;", "&")
    }

    private fun extractUrls(text: String): List<String> {
        return Regex("""https?://[^\s"'<>\\]+""", RegexOption.IGNORE_CASE)
            .findAll(text)
            .map { it.value.trimEnd('.', ',', ';', ')', '\\') }
            .toList()
    }

    private fun addUrl(url: String) {
        val clean = url.trim().trimEnd(',', ';', ')')
        if (isStream(clean)) synchronized(found) { found.add(clean) }
    }

    private fun bestUrl(): String? {
        val copy = synchronized(found) { found.toList() }.filter { isStream(it) }
        return copy.maxByOrNull { rank(it) }
    }

    private fun isSidePreview(url: String): Boolean {
        val name = url.lowercase().substringBefore("?").substringAfterLast("/")
        return "heat-preview" in name || "trailer" in name || "teaser" in name ||
            name.startsWith("pv_") || name.startsWith("preview") || name.startsWith("sample")
    }

    private fun isPlaylistUrl(url: String): Boolean {
        if (!isStream(url)) return false
        val lower = url.lowercase()
        return ".m3u8" in lower || ".mpd" in lower || "multi=" in lower
    }

    private fun isStream(url: String): Boolean {
        if (url.isBlank() || url.startsWith("blob:") || url.startsWith("data:")) return false
        val lower = url.lowercase()
        if (listOf("doubleclick", "googlesyndication", "imasdk", "/ads/", "exoclick", "juicyads").any { it in lower }) {
            return false
        }
        val path = lower.substringBefore("?").substringBefore("#")
        if (path.endsWith(".ts") || path.endsWith(".m4s") || path.endsWith(".jpg") || path.endsWith(".png") || path.endsWith(".vtt")) {
            return false
        }
        if (isSidePreview(url)) return false
        return ".m3u8" in lower || ".mpd" in lower || "multi=" in lower ||
            path.endsWith(".mp4") || path.endsWith(".webm") || path.endsWith(".mkv") ||
            path.endsWith(".m4v") || path.endsWith(".mov")
    }

    private fun rank(url: String): Int {
        val lower = url.lowercase()
        var score = 0
        if ("multi=" in lower) score += 5000
        if (".m3u8" in lower) score += 200
        if (".mpd" in lower) score += 180
        if (".mp4" in lower && ".m3u8" !in lower) score += 80
        if (".webm" in lower || ".mkv" in lower) score += 70
        val name = lower.substringBefore("?").substringAfterLast("/")
        if (name.startsWith("hq_")) score += 350
        if (name.startsWith("m_")) score -= 80
        if (isSidePreview(lower)) score -= 4000
        score += url.length.coerceAtMost(2_000)
        return score
    }

    private fun silence() {
        webView.evaluateJavascript(
            "(function(){var nodes=document.querySelectorAll('video');for(var i=0;i<nodes.length;i++){nodes[i].muted=true;nodes[i].pause();}})();",
            null,
        )
        webView.stopLoading()
    }

    private fun isBlocked(title: String): Boolean {
        val lower = title.lowercase()
        return "just a moment" in lower || "um momento" in lower || "attention required" in lower
    }

    private fun httpPrefix(url: String, headers: Map<String, String>, limit: Int): ByteArray {
        val builder = Request.Builder().url(url)
        headers.forEach { (key, value) -> builder.header(key, value) }
        client.newCall(builder.build()).execute().use { response ->
            if (!response.isSuccessful) throw IllegalStateException("Não consegui ler o vídeo (${response.code}).")
            val stream = response.body?.byteStream() ?: throw IllegalStateException("Resposta vazia.")
            val buffer = ByteArray(limit)
            var offset = 0
            while (offset < limit) {
                val read = stream.read(buffer, offset, limit - offset)
                if (read < 0) break
                offset += read
            }
            return if (offset == buffer.size) buffer else buffer.copyOf(offset)
        }
    }

    private fun httpText(url: String, headers: Map<String, String>): String = httpBytes(url, headers).toString(Charsets.UTF_8)

    private fun isPicture(url: String): Boolean {
        val lower = url.lowercase()
        val path = lower.substringBefore("?").substringBefore("#")
        if (listOf("doubleclick", "googlesyndication", "exoclick", "/ads/", "favicon", "sprite", "emoji", "logo").any { it in lower }) {
            return false
        }
        return path.endsWith(".jpg") || path.endsWith(".jpeg") || path.endsWith(".png") ||
            path.endsWith(".webp") || path.endsWith(".avif") || path.endsWith(".gif")
    }

    private fun rankPicture(url: String, page: String): Int {
        val lower = url.lowercase()
        var score = 0
        if (listOf("thumb", "poster", "cover", "screenshot", "preview").any { it in lower }) score += 40
        val ids = Regex("""\d{5,}""").findAll(page).map { it.value }
        if (ids.any { it in url }) score += 80
        return score
    }

    private suspend fun loadCover(urls: List<String>, headers: Map<String, String>, page: String): ByteArray? {
        for (url in urls) {
            if (!url.startsWith("http")) continue
            val captured = synchronized(pictures) { pictures[url] }.orEmpty()
            val imageHeaders = LinkedHashMap<String, String>()
            imageHeaders.putAll(captured)
            imageHeaders["User-Agent"] = headers["User-Agent"].orEmpty()
            imageHeaders["Referer"] = captured["Referer"] ?: captured["referer"] ?: page
            imageHeaders["Accept"] = "image/jpeg,image/webp,image/png,image/*;q=0.8"
            val cookie = CookieManager.getInstance().getCookie(url).orEmpty()
                .ifBlank { headers["Cookie"].orEmpty() }
            if (cookie.isNotBlank()) imageHeaders["Cookie"] = cookie
            val direct = runCatching { httpBytes(url, imageHeaders) }.getOrNull()
            if (direct != null && looksLikeImage(direct)) return direct
        }
        val first = urls.firstOrNull { it.startsWith("http") } ?: return null
        return coverFromPage(first)
    }

    private suspend fun coverFromPage(url: String): ByteArray? {
        val payload = withContext(Dispatchers.Main) {
            withTimeoutOrNull(12_000) {
                suspendCancellableCoroutine<String> { cont ->
                    coverCont = cont
                    cont.invokeOnCancellation { if (coverCont === cont) coverCont = null }
                    val quoted = JSONObject.quote(url)
                    webView.evaluateJavascript(
                        """
                        (function() {
                          fetch($quoted, {credentials: 'include'}).then(function(response) {
                            if (!response.ok) throw new Error('no');
                            return response.arrayBuffer();
                          }).then(function(buffer) {
                            var bytes = new Uint8Array(buffer);
                            var binary = '';
                            for (var i = 0; i < bytes.length; i += 8192) {
                              var copy = [];
                              var end = Math.min(i + 8192, bytes.length);
                              for (var j = i; j < end; j++) copy.push(bytes[j]);
                              binary += String.fromCharCode.apply(null, copy);
                            }
                            window.BF.cover(btoa(binary));
                          }).catch(function() { window.BF.cover(''); });
                        })();
                        """.trimIndent(),
                        null,
                    )
                }
            }
        } ?: return null
        if (payload.isBlank()) return null
        val bytes = runCatching { Base64.decode(payload, Base64.DEFAULT) }.getOrNull() ?: return null
        return bytes.takeIf { looksLikeImage(it) }
    }

    private fun acceptCover(payload: String) {
        val cont = coverCont ?: return
        coverCont = null
        if (cont.isActive) cont.resume(payload)
    }

    private fun looksLikeImage(bytes: ByteArray): Boolean {
        if (bytes.size < 200) return false
        if (bytes[0] == 0xFF.toByte() && bytes[1] == 0xD8.toByte()) return true
        if (bytes[0] == 0x89.toByte() && bytes[1] == 0x50.toByte()) return true
        if (bytes[0] == 0x47.toByte() && bytes[1] == 0x49.toByte()) return true
        val head = String(bytes, 0, minOf(bytes.size, 64), Charsets.ISO_8859_1)
        if (head.startsWith("RIFF") && "WEBP" in head) return true
        if ("ftyp" in head && ("avif" in head || "avis" in head || "heic" in head)) return true
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)
        return bounds.outWidth > 0 && bounds.outHeight > 0
    }

    private fun httpBytes(url: String, headers: Map<String, String>): ByteArray {
        val builder = Request.Builder().url(url)
        headers.forEach { (key, value) -> builder.header(key, value) }
        client.newCall(builder.build()).execute().use { response ->
            if (!response.isSuccessful) throw IllegalStateException("Não consegui ler o vídeo (${response.code}).")
            return response.body?.bytes() ?: throw IllegalStateException("Resposta vazia.")
        }
    }

    private fun clean(value: String): String = value.replace(Regex("\\s+"), " ").trim()

    private data class PreviewText(val title: String, val imageUrls: List<String>)

    private class UrlSink(
        private val onRaw: (String) -> Unit,
        private val onCover: (String) -> Unit,
    ) {
        @JavascriptInterface
        fun report(payload: String) {
            onRaw(payload)
        }

        @JavascriptInterface
        fun cover(payload: String) {
            onCover(payload)
        }
    }
}
