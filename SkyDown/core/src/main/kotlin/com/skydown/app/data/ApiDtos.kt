package com.skydown.app.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject

@Serializable
data class BskyError(
    val error: String? = null,
    val message: String? = null,
)

@Serializable
data class BskyProfile(
    val did: String? = null,
    val handle: String? = null,
    val displayName: String? = null,
    val avatar: String? = null,
    val banner: String? = null,
)

@Serializable
data class DidDoc(
    val service: List<DidService> = emptyList(),
)

@Serializable
data class DidService(
    val type: String? = null,
    val serviceEndpoint: String? = null,
)

@Serializable
data class BskyAuthorFeed(
    val feed: List<BskyFeedItem> = emptyList(),
    val cursor: String? = null,
)

@Serializable
data class BskyFeedItem(
    val post: BskyPost? = null,
    val reason: JsonObject? = null,
)

@Serializable
data class BskyPost(
    val uri: String? = null,
    val author: BskyAuthor? = null,
    val record: BskyRecord? = null,
    val embed: BskyEmbed? = null,
)

@Serializable
data class BskyAuthor(
    val did: String? = null,
    val handle: String? = null,
)

@Serializable
data class BskyRecord(
    val text: String? = null,
)

@Serializable
data class BskyEmbed(
    @SerialName("\$type") val type: String? = null,
    val images: List<BskyImage> = emptyList(),
    val cid: String? = null,
    val playlist: String? = null,
    val thumbnail: String? = null,
    val presentation: String? = null,
    val media: BskyEmbed? = null,
)

@Serializable
data class BskyImage(
    val thumb: String? = null,
    val fullsize: String? = null,
)
