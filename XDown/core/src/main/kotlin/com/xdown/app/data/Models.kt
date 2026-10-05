package com.xdown.app.data

data class Profile(
    val id: String,
    val name: String,
    val handle: String,
    val avatarUrl: String?,
    val bannerUrl: String?,
    val bio: String,
    val mediaCount: Int?,
    val isProtected: Boolean,
    val isVerified: Boolean,
)

enum class MediaKind { PHOTO, VIDEO, GIF }

data class MediaItem(
    val id: String,
    val tweetId: String,
    val tweetUrl: String,
    val tweetText: String,
    val createdAt: String,
    val kind: MediaKind,
    val downloadUrl: String,
    val previewUrl: String,
    val width: Int,
    val height: Int,
    val fileName: String,
    val mimeType: String,
) {
    fun imagePreviewUrl(): String? {
        val url = previewUrl.trim()
        if (url.isEmpty()) return null
        val lower = url.lowercase()
        if (lower.contains("video.twimg.com") || lower.contains(".mp4")) return null
        return url
    }
}

data class MediaPage(
    val items: List<MediaItem>,
    val nextCursor: String?,
)

class XDownException(message: String) : Exception(message)
