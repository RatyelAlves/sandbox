package app.baixador

import android.content.ContentValues
import android.content.Context
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import com.arthenica.ffmpegkit.FFmpegKit
import com.arthenica.ffmpegkit.ReturnCode
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import kotlin.coroutines.coroutineContext
import kotlin.coroutines.resume

class Downloader(
    private val context: Context,
    private val client: OkHttpClient,
) {
    suspend fun save(media: MediaInfo, onProgress: (Float, String) -> Unit): String = withContext(Dispatchers.IO) {
        val headers = requestHeaders(media)
        val folder = File(context.cacheDir, "job-${System.currentTimeMillis()}").apply { mkdirs() }
        val mp4 = File(folder, "video.mp4")
        val fetched = openFetch(media.streamUrl, headers)
        try {
            val ready = when (fetched.kind) {
                "hls" -> savePlaylist(fetched.text, media, headers, folder, mp4, onProgress)
                "mpd" -> {
                    onProgress(0.02f, "Baixando 0%")
                    copyToMp4(media.streamUrl, headers, mp4, media.durationSeconds, onProgress)
                }
                "mp4" -> {
                    writeFetch(fetched, mp4, onProgress)
                    true
                }
                else -> {
                    val raw = File(folder, "source.bin")
                    writeFetch(fetched, raw, onProgress)
                    onProgress(0.92f, "Montando o MP4…")
                    remux(
                        mutableListOf("-y", "-hide_banner", "-loglevel", "error", "-i", raw.absolutePath),
                        mp4,
                        media.durationSeconds,
                        onProgress,
                    )
                }
            }
            if (!ready) throw IllegalStateException("Não consegui montar o MP4.")
            coroutineContext.ensureActive()
            val name = uniqueName(safeName(media.title), "mp4")
            mp4.inputStream().use { input ->
                writeStream(name, "video/mp4", input, mp4.length())
            }
            name
        } finally {
            fetched.close()
            folder.deleteRecursively()
        }
    }

    private suspend fun savePlaylist(
        playlist: String,
        media: MediaInfo,
        headers: Map<String, String>,
        folder: File,
        mp4: File,
        onProgress: (Float, String) -> Unit,
    ): Boolean {
        val variant = Playlist.bestVariant(playlist, media.streamUrl)
        val mediaUrl = variant?.url ?: media.streamUrl
        val mediaText = if (variant == null) playlist else httpText(mediaUrl, headers)
        val parts = Playlist.segments(mediaText, mediaUrl)
        if (parts.isEmpty()) throw IllegalStateException("A lista do vídeo veio vazia.")
        val seconds = Playlist.durationSeconds(mediaText).takeIf { it > 1.0 } ?: media.durationSeconds
        onProgress(0.02f, "Baixando 0%")
        return copyToMp4(mediaUrl, headers, mp4, seconds, onProgress)
            || copyPieces(parts, headers, folder, mp4, onProgress)
    }

    private suspend fun copyToMp4(
        url: String,
        headers: Map<String, String>,
        mp4: File,
        durationSeconds: Double,
        onProgress: (Float, String) -> Unit,
    ): Boolean {
        val headerBlob = buildString {
            headers.forEach { (key, value) ->
                append(key)
                append(": ")
                append(value)
                append("\r\n")
            }
        }
        val opening = mutableListOf(
            "-y",
            "-hide_banner",
            "-loglevel", "error",
            "-reconnect", "1",
            "-reconnect_streamed", "1",
            "-reconnect_delay_max", "5",
            "-http_persistent", "0",
            "-protocol_whitelist", "file,crypto,data,http,https,tcp,tls",
            "-allowed_extensions", "ALL",
        )
        if (headerBlob.isNotBlank()) {
            opening += listOf("-headers", headerBlob)
        }
        opening += listOf("-i", url)
        return remux(opening, mp4, durationSeconds, onProgress)
    }

    private suspend fun copyPieces(
        parts: List<String>,
        headers: Map<String, String>,
        folder: File,
        mp4: File,
        onProgress: (Float, String) -> Unit,
    ): Boolean {
        val raw = File(folder, "video.ts")
        raw.outputStream().use { output ->
            val groups = parts.chunked(4)
            var done = 0
            for (group in groups) {
                coroutineContext.ensureActive()
                val chunks = coroutineScope {
                    group.map { url ->
                        async { httpBytes(url, headers) }
                    }.awaitAll()
                }
                for (chunk in chunks) {
                    output.write(chunk)
                    done += 1
                    val percent = (done * 100 / parts.size).coerceIn(0, 99)
                    onProgress(percent / 100f, "Baixando $percent%")
                }
            }
        }
        coroutineContext.ensureActive()
        onProgress(0.99f, "Montando o MP4…")
        return remux(mutableListOf("-y", "-hide_banner", "-loglevel", "error", "-i", raw.absolutePath), mp4, 0.0, onProgress)
    }

    private suspend fun remux(
        opening: List<String>,
        mp4: File,
        durationSeconds: Double,
        onProgress: (Float, String) -> Unit,
    ): Boolean {
        val attempts = listOf(
            listOf("-c", "copy", "-bsf:a", "aac_adtstoasc", "-movflags", "+faststart"),
            listOf("-c", "copy", "-movflags", "+faststart"),
            listOf("-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-c:a", "aac", "-movflags", "+faststart"),
        )
        for (tail in attempts) {
            coroutineContext.ensureActive()
            if (mp4.exists()) mp4.delete()
            val args = opening + tail + mp4.absolutePath
            if (runFfmpeg(args, mp4, durationSeconds, onProgress)) return true
        }
        if (mp4.exists()) mp4.delete()
        return false
    }

    private suspend fun runFfmpeg(
        args: List<String>,
        output: File,
        durationSeconds: Double,
        onProgress: (Float, String) -> Unit,
    ): Boolean = suspendCancellableCoroutine { cont ->
        var lastPercent = -1
        val session = FFmpegKit.executeWithArgumentsAsync(
            args.toTypedArray(),
            { finished ->
                if (!cont.isActive) return@executeWithArgumentsAsync
                if (ReturnCode.isCancel(finished.returnCode)) {
                    cont.cancel()
                    return@executeWithArgumentsAsync
                }
                val ok = ReturnCode.isSuccess(finished.returnCode) && output.exists() && output.length() > 1024
                cont.resume(ok)
            },
            { },
            { stats ->
                if (durationSeconds <= 1.0) return@executeWithArgumentsAsync
                val percent = ((stats.time / (durationSeconds * 1000.0)) * 100).toInt().coerceIn(0, 99)
                if (percent == lastPercent) return@executeWithArgumentsAsync
                lastPercent = percent
                onProgress(percent / 100f, "Baixando $percent%")
            },
        )
        cont.invokeOnCancellation {
            FFmpegKit.cancel(session.sessionId)
            if (output.exists()) output.delete()
        }
    }

    private fun openFetch(url: String, headers: Map<String, String>): Fetched {
        val builder = Request.Builder().url(url)
        headers.forEach { (key, value) -> builder.header(key, value) }
        val response = client.newCall(builder.build()).execute()
        if (!response.isSuccessful) {
            response.close()
            throw IllegalStateException("O servidor recusou o vídeo (${response.code}).")
        }
        val body = response.body
        if (body == null) {
            response.close()
            throw IllegalStateException("Resposta vazia.")
        }
        val stream = body.byteStream()
        val buffer = ByteArray(512)
        var offset = 0
        while (offset < buffer.size) {
            val read = stream.read(buffer, offset, buffer.size - offset)
            if (read < 0) break
            offset += read
        }
        val prefix = if (offset == buffer.size) buffer else buffer.copyOf(offset)
        val kind = sniff(prefix)
        if (kind == "hls" || kind == "mpd") {
            val rest = stream.readBytes()
            val text = prefix.toString(Charsets.UTF_8) + rest.toString(Charsets.UTF_8)
            response.close()
            return Fetched(kind, text, ByteArray(0), null, null)
        }
        return Fetched(kind, "", prefix, response, stream)
    }

    private fun sniff(bytes: ByteArray): String {
        val text = bytes.toString(Charsets.UTF_8).trimStart('\uFEFF', ' ', '\n', '\r', '\t')
        if (text.startsWith("#EXTM3U")) return "hls"
        if (text.startsWith("<MPD") || text.startsWith("<?xml") || "<MPD" in text.take(400)) return "mpd"
        val head = bytes.copyOfRange(0, minOf(bytes.size, 64)).toString(Charsets.ISO_8859_1)
        if ("ftyp" in head) return "mp4"
        return "other"
    }

    private suspend fun writeFetch(fetched: Fetched, destination: File, onProgress: (Float, String) -> Unit) {
        val stream = fetched.stream ?: throw IllegalStateException("Resposta vazia.")
        val total = fetched.response?.body?.contentLength() ?: -1L
        destination.outputStream().use { output ->
            if (fetched.prefix.isNotEmpty()) output.write(fetched.prefix)
            var done = fetched.prefix.size.toLong()
            var lastMark = 0L
            val buffer = ByteArray(256 * 1024)
            while (true) {
                coroutineContext.ensureActive()
                val read = stream.read(buffer)
                if (read < 0) break
                output.write(buffer, 0, read)
                done += read
                if (total > 0) {
                    val percent = (done * 100 / total).toInt().coerceIn(0, 100)
                    if (percent.toLong() != lastMark) {
                        lastMark = percent.toLong()
                        onProgress(percent / 100f, "Baixando $percent%")
                    }
                } else if (done - lastMark >= 2L * 1024 * 1024) {
                    lastMark = done
                    onProgress(0.5f, "Baixando…")
                }
            }
        }
        fetched.close()
        if (destination.length() <= 0) throw IllegalStateException("O arquivo saiu vazio.")
    }

    private class Fetched(
        val kind: String,
        val text: String,
        val prefix: ByteArray,
        val response: okhttp3.Response?,
        val stream: java.io.InputStream?,
    ) {
        fun close() {
            runCatching { stream?.close() }
            runCatching { response?.close() }
        }
    }

    private fun httpText(url: String, headers: Map<String, String>): String {
        return httpBytes(url, headers).toString(Charsets.UTF_8)
    }

    private fun httpBytes(url: String, headers: Map<String, String>): ByteArray {
        val builder = Request.Builder().url(url)
        headers.forEach { (key, value) -> builder.header(key, value) }
        client.newCall(builder.build()).execute().use { response ->
            if (!response.isSuccessful) {
                throw IllegalStateException("O servidor recusou um pedaço do vídeo (${response.code}).")
            }
            return response.body?.bytes() ?: throw IllegalStateException("Resposta vazia.")
        }
    }

    private fun writeDownload(name: String, mime: String, bytes: ByteArray) {
        writeStream(name, mime, bytes.inputStream(), bytes.size.toLong())
    }

    private fun writeStream(name: String, mime: String, input: java.io.InputStream, length: Long) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val values = ContentValues().apply {
                put(MediaStore.Downloads.DISPLAY_NAME, name)
                put(MediaStore.Downloads.MIME_TYPE, mime)
                put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Baixador")
                put(MediaStore.Downloads.IS_PENDING, 1)
            }
            val uri = context.contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
                ?: throw IllegalStateException("Não consegui criar o arquivo em Downloads.")
            context.contentResolver.openOutputStream(uri)?.use { output ->
                input.copyTo(output)
            } ?: throw IllegalStateException("Não consegui gravar o arquivo.")
            values.clear()
            values.put(MediaStore.Downloads.IS_PENDING, 0)
            context.contentResolver.update(uri, values, null, null)
        } else {
            val dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
            val folder = File(dir, "Baixador").apply { mkdirs() }
            File(folder, name).outputStream().use { output -> input.copyTo(output) }
        }
        if (length <= 0) throw IllegalStateException("O arquivo saiu vazio.")
    }

    private fun requestHeaders(media: MediaInfo): Map<String, String> {
        val origin = runCatching {
            val uri = java.net.URI(media.pageUrl)
            "${uri.scheme}://${uri.host}"
        }.getOrDefault("")
        return buildMap {
            put("User-Agent", media.userAgent)
            put("Referer", media.pageUrl)
            put("Accept", "*/*")
            if (origin.isNotBlank()) put("Origin", origin)
            if (media.cookie.isNotBlank()) put("Cookie", media.cookie)
        }
    }

    private fun safeName(name: String): String {
        return name.replace(Regex("""\s*[-|–—]\s*BoyfriendTV.*$""", RegexOption.IGNORE_CASE), "")
            .replace(Regex("""[<>:"/\\|?*\n\r\t]"""), " ")
            .replace(Regex("""\s+"""), " ")
            .trim(' ', '.')
            .take(80)
            .ifBlank { "video" }
    }

    private fun uniqueName(stem: String, extension: String): String {
        return "$stem.$extension"
    }
}
