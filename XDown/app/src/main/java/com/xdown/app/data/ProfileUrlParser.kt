package com.xdown.app.data

/**
 * Extracts an X/Twitter handle from a profile URL, @handle, or raw username.
 */
object ProfileUrlParser {
    private val handleRegex = Regex("^[A-Za-z0-9_]{1,15}$")
    private val hosts = setOf(
        "x.com",
        "twitter.com",
        "mobile.twitter.com",
        "mobile.x.com",
        "www.x.com",
        "www.twitter.com",
    )
    private val reservedPaths = setOf(
        "home", "explore", "search", "settings", "i", "intent", "compose",
        "notifications", "messages", "login", "signup", "tos", "privacy",
        "hashtag", "share", "about", "help", "jobs", "download", "premium",
        "verified", "topics", "lists", "bookmarks", "communities", "connect",
        "following", "followers", "messages", "compose", "flow",
    )

    fun extractHandle(raw: String): String? {
        val input = raw.trim()
        if (input.isEmpty()) return null

        val withoutAt = input.removePrefix("@").trim()
        if (looksLikeBareHandle(withoutAt)) return withoutAt

        val urlText = when {
            input.startsWith("http://", ignoreCase = true) ||
                input.startsWith("https://", ignoreCase = true) -> input
            startsWithKnownHost(withoutAt) -> "https://$withoutAt"
            else -> return null
        }

        return handleFromUrl(urlText)
    }

    private fun looksLikeBareHandle(value: String): Boolean {
        return handleRegex.matches(value) && value.lowercase() !in reservedPaths
    }

    private fun startsWithKnownHost(value: String): Boolean {
        val host = value.substringBefore("/").substringBefore("?").lowercase()
        return host in hosts
    }

    private fun handleFromUrl(urlText: String): String? {
        val match = Regex(
            """^https?://([^/]+)/([^/?#]+)""",
            RegexOption.IGNORE_CASE,
        ).find(urlText) ?: return null

        val host = match.groupValues[1].lowercase().removePrefix("www.")
        if (host !in setOf("x.com", "twitter.com", "mobile.twitter.com", "mobile.x.com")) {
            return null
        }

        val segment = match.groupValues[2].removePrefix("@")
        if (segment.lowercase() in reservedPaths) return null
        return segment.takeIf { handleRegex.matches(it) }
    }
}
