package com.skydown.app.data

object MediaMapper {
    fun toProfile(user: BskyProfile, fallbackHandle: String, pdsEndpoint: String): Profile {
        val handle = user.handle?.ifBlank { null } ?: fallbackHandle
        return Profile(
            id = user.did.orEmpty(),
            name = user.displayName?.ifBlank { null } ?: handle,
            handle = handle,
            avatarUrl = user.avatar,
            bannerUrl = user.banner,
            pdsEndpoint = pdsEndpoint,
        )
    }

    fun toMediaItems(post: BskyPost, profile: Profile): List<MediaItem> {
        val uri = post.uri ?: return emptyList()
        val rkey = uri.substringAfterLast("/")
        if (rkey.isBlank()) return emptyList()
        val handle = post.author?.handle ?: profile.handle
        val postText = post.record?.text.orEmpty()
        val did = post.author?.did ?: profile.id
        val items = mutableListOf<MediaItem>()
        collectEmbeds(post.embed).forEach { embed ->
            items += imagesFrom(embed, rkey, handle, postText, did, profile.pdsEndpoint)
            videoFrom(embed, rkey, handle, postText, did, profile.pdsEndpoint)?.let {
                items += it
            }
        }
        return items
    }

    fun blobUrl(pdsEndpoint: String, did: String, cid: String): String {
        val base = pdsEndpoint.trimEnd('/')
        val encodedDid = java.net.URLEncoder.encode(did, Charsets.UTF_8.name())
        return "$base/xrpc/com.atproto.sync.getBlob?did=$encodedDid&cid=$cid"
    }

    fun cidFromCdnUrl(url: String): String? {
        val match = Regex(
            """cdn\.bsky\.app/img/[^/]+/plain/[^/]+/([^/@?]+)""",
            RegexOption.IGNORE_CASE,
        ).find(url)
        return match?.groupValues?.get(1)?.takeIf { it.isNotBlank() }
    }

    private fun collectEmbeds(embed: BskyEmbed?): List<BskyEmbed> {
        if (embed == null) return emptyList()
        val nested = embed.media?.let { collectEmbeds(it) }.orEmpty()
        return listOf(embed) + nested
    }

    private fun imagesFrom(
        embed: BskyEmbed,
        rkey: String,
        handle: String,
        postText: String,
        did: String,
        pdsEndpoint: String,
    ): List<MediaItem> {
        if (!embed.type.orEmpty().contains("images", ignoreCase = true) && embed.images.isEmpty()) {
            return emptyList()
        }
        return embed.images.mapIndexedNotNull { index, image ->
            val preview = image.thumb ?: image.fullsize ?: return@mapIndexedNotNull null
            val cid = image.fullsize?.let(::cidFromCdnUrl) ?: image.thumb?.let(::cidFromCdnUrl)
            val download = if (cid != null) {
                blobUrl(pdsEndpoint, did, cid)
            } else {
                image.fullsize ?: preview
            }
            MediaItem(
                id = "${rkey}_p$index",
                postText = postText,
                kind = MediaKind.PHOTO,
                downloadUrl = download,
                previewUrl = preview,
                playbackUrl = download,
                fileName = fileName(handle, rkey, index, "jpg"),
                mimeType = "image/jpeg",
            )
        }
    }

    private fun videoFrom(
        embed: BskyEmbed,
        rkey: String,
        handle: String,
        postText: String,
        did: String,
        pdsEndpoint: String,
    ): MediaItem? {
        if (!embed.type.orEmpty().contains("video", ignoreCase = true)) return null
        val cid = embed.cid ?: return null
        val isGif = embed.presentation.equals("gif", ignoreCase = true)
        val download = blobUrl(pdsEndpoint, did, cid)
        val preview = embed.thumbnail ?: download
        return MediaItem(
            id = "${rkey}_v0",
            postText = postText,
            kind = if (isGif) MediaKind.GIF else MediaKind.VIDEO,
            downloadUrl = download,
            previewUrl = preview,
            playbackUrl = embed.playlist?.takeIf { it.isNotBlank() } ?: download,
            fileName = fileName(handle, rkey, 0, "mp4"),
            mimeType = "video/mp4",
        )
    }

    private fun fileName(handle: String, postId: String, index: Int, ext: String): String {
        val safeHandle = handle.replace(Regex("[^A-Za-z0-9]+"), "_").trim('_')
        return "${safeHandle}_${postId}_$index.$ext"
    }
}
