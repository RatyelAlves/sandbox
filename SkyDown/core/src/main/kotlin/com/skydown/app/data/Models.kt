package com.skydown.app.data

data class Profile(
    val id: String,
    val name: String,
    val handle: String,
    val avatarUrl: String?,
    val bannerUrl: String?,
    val pdsEndpoint: String,
)

enum class MediaKind { PHOTO, VIDEO, GIF }

data class MediaItem(
    val id: String,
    val postText: String,
    val kind: MediaKind,
    val downloadUrl: String,
    val previewUrl: String,
    val playbackUrl: String,
    val fileName: String,
    val mimeType: String,
)

data class MediaPage(
    val items: List<MediaItem>,
    val nextCursor: String?,
)

class SkyDownException(message: String) : Exception(message)
