package com.skydown.app.data

/**
 * Extracts a Bluesky handle or DID from a profile URL, @handle, or raw username.
 */
object ProfileUrlParser {
    private val hosts = setOf(
        "bsky.app",
        "www.bsky.app",
        "staging.bsky.app",
        "bsky.social",
        "www.bsky.social",
    )
    private val reservedFirstSegments = setOf(
        "about", "blog", "chat", "download", "feeds", "hashtag", "intent",
        "lists", "messages", "moderation", "notifications", "privacy",
        "search", "settings", "starter-packs", "support", "tos",
    )
    private val didPlcRegex = Regex("^did:plc:[a-z2-7]{24,}$", RegexOption.IGNORE_CASE)
    private val didWebRegex = Regex("^did:web:[A-Za-z0-9._:-]+$")
    private val handleRegex = Regex(
        "^[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$",
    )
    private val shortNameRegex = Regex("^[A-Za-z0-9][A-Za-z0-9-]{0,62}$")

    fun extractHandle(raw: String): String? {
        val input = raw.trim()
        if (input.isEmpty()) return null

        val withoutAt = input.removePrefix("@").trim()
        actorFromPlain(withoutAt)?.let { return it }

        val urlText = when {
            input.startsWith("http://", ignoreCase = true) ||
                input.startsWith("https://", ignoreCase = true) -> input
            startsWithKnownHost(withoutAt) -> "https://$withoutAt"
            else -> return null
        }

        return actorFromUrl(urlText)
    }

    private fun actorFromPlain(value: String): String? {
        val lowered = value.lowercase()
        if (didPlcRegex.matches(lowered)) return lowered
        if (didWebRegex.matches(lowered)) return lowered
        if (handleRegex.matches(value)) return value.lowercase()
        if (shortNameRegex.matches(value) && lowered !in reservedFirstSegments) {
            return "$lowered.bsky.social"
        }
        return null
    }

    private fun startsWithKnownHost(value: String): Boolean {
        val host = value.substringBefore("/").substringBefore("?").lowercase()
        return host in hosts
    }

    private fun actorFromUrl(urlText: String): String? {
        val match = Regex(
            """^https?://([^/]+)/profile/([^/?#]+)""",
            RegexOption.IGNORE_CASE,
        ).find(urlText) ?: return null

        val host = match.groupValues[1].lowercase().removePrefix("www.")
        if (host !in setOf("bsky.app", "staging.bsky.app", "bsky.social")) {
            return null
        }

        val segment = decode(match.groupValues[2]).removePrefix("@")
        if (segment.lowercase() in reservedFirstSegments) return null
        return actorFromPlain(segment)
    }

    private fun decode(value: String): String {
        return runCatching {
            java.net.URLDecoder.decode(value, Charsets.UTF_8.name())
        }.getOrDefault(value)
    }
}
