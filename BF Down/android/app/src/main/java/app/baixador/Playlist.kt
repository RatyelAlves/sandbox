package app.baixador

import java.net.URI

data class Variant(
    val url: String,
    val width: Int,
    val height: Int,
    val bandwidth: Int,
)

object Playlist {
    fun resolve(base: String, ref: String): String {
        val target = ref.trim()
        if (target.startsWith("http://") || target.startsWith("https://")) return target
        return URI(base).resolve(target).toString()
    }

    fun bestVariant(playlist: String, playlistUrl: String): Variant? {
        return variants(playlist, playlistUrl).firstOrNull()
    }

    fun variants(playlist: String, playlistUrl: String): List<Variant> {
        if (!playlist.contains("#EXT-X-STREAM-INF")) return emptyList()
        val found = mutableListOf<Variant>()
        var pending: Triple<Int, Int, Int>? = null
        for (raw in playlist.lineSequence()) {
            val line = raw.trim()
            if (line.startsWith("#EXT-X-STREAM-INF")) {
                val width = match(line, "RESOLUTION=(\\d+)x(\\d+)")?.groupValues?.getOrNull(1)?.toIntOrNull() ?: 0
                val height = match(line, "RESOLUTION=(\\d+)x(\\d+)")?.groupValues?.getOrNull(2)?.toIntOrNull() ?: 0
                val bandwidth = match(line, "BANDWIDTH=(\\d+)")?.groupValues?.getOrNull(1)?.toIntOrNull() ?: 0
                pending = Triple(width, height, bandwidth)
                continue
            }
            if (pending == null || line.isEmpty() || line.startsWith("#")) continue
            found += Variant(resolve(playlistUrl, line), pending.first, pending.second, pending.third)
            pending = null
        }
        return found.sortedWith(
            compareByDescending<Variant> { it.width * it.height }.thenByDescending { it.bandwidth }
        )
    }

    fun choiceLabel(variant: Variant, siblings: List<Variant>): String {
        val base = baseLabel(variant)
        val shared = siblings.count { baseLabel(it) == base } > 1
        return if (shared && variant.width > 0) "${variant.width}×${variant.height}" else base
    }

    private fun baseLabel(variant: Variant): String {
        return when {
            variant.height > 0 -> "${variant.height}p"
            variant.bandwidth > 0 -> "${variant.bandwidth / 1000} kbps"
            else -> "Original"
        }
    }

    fun segments(playlist: String, playlistUrl: String): List<String> {
        val found = mutableListOf<String>()
        for (raw in playlist.lineSequence()) {
            val line = raw.trim()
            if (line.startsWith("#EXT-X-MAP")) {
                val uri = Regex("""URI="([^"]+)"""").find(line)?.groupValues?.getOrNull(1)
                if (!uri.isNullOrBlank()) found += resolve(playlistUrl, uri)
                continue
            }
            if (line.isEmpty() || line.startsWith("#")) continue
            found += resolve(playlistUrl, line)
        }
        return found
    }

    fun durationSeconds(playlist: String): Double {
        var total = 0.0
        for (raw in playlist.lineSequence()) {
            val line = raw.trim()
            if (!line.startsWith("#EXTINF:")) continue
            val number = line.substringAfter(":").substringBefore(",").trim()
            total += number.toDoubleOrNull() ?: 0.0
        }
        return total
    }

    fun looksLikePlaylist(text: String): Boolean = text.trimStart().startsWith("#EXTM3U")

    private fun match(line: String, pattern: String) = Regex(pattern).find(line)
}
