package com.xdown.app.data

object MediaMapper {
    fun toProfile(user: ApiUser, fallbackHandle: String): Profile {
        return Profile(
            id = user.id.orEmpty(),
            name = user.name?.ifBlank { null } ?: fallbackHandle,
            handle = user.screenName?.ifBlank { null } ?: fallbackHandle,
            avatarUrl = user.avatarUrl?.replace("_normal", "_400x400"),
            bannerUrl = user.bannerUrl,
            bio = user.description.orEmpty(),
            mediaCount = user.mediaCount,
            isProtected = user.protected,
            isVerified = user.verification?.verified == true,
        )
    }

    fun toMediaItems(status: ApiStatus, handle: String): List<MediaItem> {
        val tweetId = status.id ?: return emptyList()
        val media = status.media ?: return emptyList()
        val tweetUrl = status.url ?: "https://x.com/$handle/status/$tweetId"
        val tweetText = status.text.orEmpty()
        val createdAt = status.createdAt.orEmpty()
        val items = mutableListOf<MediaItem>()

        media.photos.forEachIndexed { index, photo ->
            val url = originalPhotoUrl(photo.url ?: return@forEachIndexed)
            items += MediaItem(
                id = "${tweetId}_p$index",
                tweetId = tweetId,
                tweetUrl = tweetUrl,
                tweetText = tweetText,
                createdAt = createdAt,
                kind = if (photo.type.equals("gif", true)) MediaKind.GIF else MediaKind.PHOTO,
                downloadUrl = url,
                previewUrl = url,
                width = photo.width,
                height = photo.height,
                fileName = fileName(handle, tweetId, index, "jpg"),
                mimeType = "image/jpeg",
            )
        }

        media.videos.forEachIndexed { index, video ->
            val url = bestVideoUrl(video) ?: return@forEachIndexed
            val isGif = video.type.equals("gif", true)
            items += MediaItem(
                id = "${tweetId}_v$index",
                tweetId = tweetId,
                tweetUrl = tweetUrl,
                tweetText = tweetText,
                createdAt = createdAt,
                kind = if (isGif) MediaKind.GIF else MediaKind.VIDEO,
                downloadUrl = url,
                previewUrl = video.thumbnailUrl ?: url,
                width = video.width,
                height = video.height,
                fileName = fileName(handle, tweetId, index, "mp4"),
                mimeType = "video/mp4",
            )
        }
        return items
    }

    fun originalPhotoUrl(url: String): String {
        if (!url.contains("pbs.twimg.com")) return url
        return when {
            Regex("name=[^&]+").containsMatchIn(url) ->
                url.replace(Regex("name=[^&]+"), "name=orig")
            url.contains("?") -> "$url&name=orig"
            else -> "$url?name=orig"
        }
    }

    fun bestVideoUrl(video: ApiVideo): String? {
        val mp4 = video.formats
            .filter { format ->
                !format.url.isNullOrBlank() &&
                    format.container.equals("mp4", true)
            }
            .maxByOrNull { format ->
                format.bitrate ?: ((format.width ?: 0) * (format.height ?: 0))
            }
        return mp4?.url ?: video.url
    }

    private fun fileName(handle: String, tweetId: String, index: Int, ext: String): String {
        val safeHandle = handle.replace(Regex("[^A-Za-z0-9_]"), "_")
        return "${safeHandle}_${tweetId}_$index.$ext"
    }
}
