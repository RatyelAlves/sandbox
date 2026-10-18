package com.savetwt.app

import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import kotlin.math.min

data class Quality(
    val width: Int,
    val height: Int,
    val label: String,
    val url: String,
)

data class Video(
    val title: String,
    val thumbnail: String?,
    val formats: List<Quality>,
)

object Twitter {
    private val statusPattern = Regex("""/status(?:es)?/(\d+)""", RegexOption.IGNORE_CASE)
    private val sizePattern = Regex("""/(\d{2,5})x(\d{2,5})/""")
    private val hosts = setOf(
        "twitter.com", "www.twitter.com", "mobile.twitter.com",
        "x.com", "www.x.com", "mobile.x.com",
        "fxtwitter.com", "vxtwitter.com", "fixupx.com", "fixvx.com",
    )

    fun fetch(raw: String): List<Video> {
        val normalized = normalize(raw)
        val (user, id) = statusParts(normalized)
        val endpoints = buildList {
            if (user != null) add("https://api.fxtwitter.com/${URLEncoder.encode(user, "UTF-8")}/status/$id")
            add("https://api.fxtwitter.com/status/$id")
        }
        var lastError: Exception? = null
        for (endpoint in endpoints) {
            try {
                val payload = getJson(endpoint)
                val tweet = payload.optJSONObject("tweet") ?: continue
                val videos = videosFrom(tweet, user)
                if (videos.isNotEmpty()) return videos
                if (tweet.length() > 0) return emptyList()
            } catch (error: Exception) {
                lastError = error
            }
        }
        throw lastError ?: IllegalStateException("Could not get this video. It may be private or deleted.")
    }

    private fun normalize(raw: String): String {
        var text = raw.trim()
        if (text.isEmpty()) throw IllegalArgumentException("Paste a video link.")
        val found = Regex("""https?://\S+""", RegexOption.IGNORE_CASE).find(text)
        text = if (found != null) {
            found.value.trimEnd(')', '.', ',', ']', '>', '"', '\'')
        } else if (!text.startsWith("http", ignoreCase = true)) {
            "https://$text"
        } else {
            text
        }
        val url = URL(text)
        val host = url.host.lowercase()
        if (host !in hosts) throw IllegalArgumentException("Use a twitter.com or x.com link.")
        if (!statusPattern.containsMatchIn(url.path)) {
            throw IllegalArgumentException("This link does not point to a post.")
        }
        return text
    }

    private fun statusParts(link: String): Pair<String?, String> {
        val url = URL(link)
        val id = statusPattern.find(url.path)?.groupValues?.get(1)
            ?: throw IllegalArgumentException("This link does not point to a post.")
        val parts = url.path.split('/').filter { it.isNotEmpty() }
        val user = if (parts.size >= 3 && parts[parts.lastIndex - 1] in setOf("status", "statuses") && parts[0] !in setOf("i", "web")) {
            parts[0]
        } else {
            null
        }
        return user to id
    }

    private fun getJson(endpoint: String): JSONObject {
        val connection = (URL(endpoint).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = 20000
            readTimeout = 20000
            setRequestProperty("User-Agent", "Mozilla/5.0")
            setRequestProperty("Accept", "application/json")
        }
        try {
            val code = connection.responseCode
            val stream = if (code in 200..299) connection.inputStream else connection.errorStream
            val body = stream.bufferedReader().use { it.readText() }
            if (code !in 200..299) throw IllegalStateException("Could not get this video. It may be private or deleted.")
            return JSONObject(body)
        } finally {
            connection.disconnect()
        }
    }

    private fun videosFrom(tweet: JSONObject, user: String?): List<Video> {
        val media = tweet.optJSONObject("media") ?: return emptyList()
        val items = mutableListOf<JSONObject>()
        media.optJSONArray("videos")?.let { array ->
            for (index in 0 until array.length()) items += array.getJSONObject(index)
        }
        if (items.isEmpty()) {
            media.optJSONArray("all")?.let { array ->
                for (index in 0 until array.length()) {
                    val item = array.getJSONObject(index)
                    val kind = item.optString("type").lowercase()
                    if (kind in setOf("video", "gif", "animated_gif") || ".mp4" in item.optString("url")) {
                        items += item
                    }
                }
            }
        }
        val author = tweet.optJSONObject("author")?.optString("name").orEmpty().ifBlank { user.orEmpty() }
        val text = tweet.optString("text").replace(Regex("""https://t\.co/\S+"""), "").trim()
        val title = "$author - $text".trim(' ', '-').ifBlank { "Twitter video" }.take(140)
        return items.mapNotNull { item ->
            val formats = formatsOf(item)
            if (formats.isEmpty()) return@mapNotNull null
            Video(
                title = title,
                thumbnail = item.optString("thumbnail_url").ifBlank { null },
                formats = formats,
            )
        }
    }

    private fun formatsOf(video: JSONObject): List<Quality> {
        val best = linkedMapOf<Pair<Int, Int>, Pair<Int, Quality>>()
        val variants = video.optJSONArray("formats") ?: video.optJSONArray("variants") ?: JSONArray()
        for (index in 0 until variants.length()) {
            val item = variants.getJSONObject(index)
            val mediaUrl = item.optString("url")
            val container = (item.optString("container") + item.optString("content_type")).lowercase()
            if ("mp4" !in container && ".mp4" !in mediaUrl) continue
            val (width, height) = dimensions(mediaUrl) ?: continue
            val bitrate = item.optInt("bitrate")
            val current = best[width to height]
            if (current == null || bitrate > current.first) {
                best[width to height] = bitrate to Quality(width, height, label(width, height), mediaUrl)
            }
        }
        val direct = video.optString("url")
        if (best.isEmpty() && ".mp4" in direct) {
            val dims = dimensions(direct) ?: (video.optInt("width") to video.optInt("height"))
            if (dims.first > 0 && dims.second > 0) {
                best[dims] = 0 to Quality(dims.first, dims.second, label(dims.first, dims.second), direct)
            }
        }
        return best.values.map { it.second }.sortedByDescending { min(it.width, it.height) }
    }

    private fun dimensions(url: String): Pair<Int, Int>? {
        val match = sizePattern.find(url) ?: return null
        return match.groupValues[1].toInt() to match.groupValues[2].toInt()
    }

    private fun label(width: Int, height: Int): String {
        val shortSide = min(width, height)
        return when {
            shortSide >= 2160 -> "4K"
            shortSide >= 1440 -> "2K QHD"
            shortSide >= 1080 -> "Full HD"
            shortSide >= 720 -> "HD Quality"
            shortSide >= 480 -> "SD Quality"
            else -> "Data Saver"
        }
    }
}
