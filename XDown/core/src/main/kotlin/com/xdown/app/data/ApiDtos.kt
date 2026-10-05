package com.xdown.app.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class UserResponse(
    val code: Int? = null,
    val message: String? = null,
    val user: ApiUser? = null,
    val reason: String? = null,
)

@Serializable
data class SearchResponse(
    val code: Int? = null,
    val message: String? = null,
    val results: List<ApiStatus> = emptyList(),
    val cursor: ApiCursor? = null,
)

@Serializable
data class ApiCursor(
    val top: String? = null,
    val bottom: String? = null,
)

@Serializable
data class ApiUser(
    val id: String? = null,
    val name: String? = null,
    @SerialName("screen_name") val screenName: String? = null,
    @SerialName("avatar_url") val avatarUrl: String? = null,
    @SerialName("banner_url") val bannerUrl: String? = null,
    val description: String? = null,
    val protected: Boolean = false,
    @SerialName("media_count") val mediaCount: Int? = null,
    val verification: ApiVerification? = null,
)

@Serializable
data class ApiVerification(
    val verified: Boolean = false,
)

@Serializable
data class ApiStatus(
    val id: String? = null,
    val url: String? = null,
    val text: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    val author: ApiUser? = null,
    val media: ApiMedia? = null,
)

@Serializable
data class ApiMedia(
    val photos: List<ApiPhoto> = emptyList(),
    val videos: List<ApiVideo> = emptyList(),
)

@Serializable
data class ApiPhoto(
    val id: String? = null,
    val type: String? = null,
    val url: String? = null,
    val width: Int = 0,
    val height: Int = 0,
)

@Serializable
data class ApiVideo(
    val id: String? = null,
    val type: String? = null,
    val url: String? = null,
    val width: Int = 0,
    val height: Int = 0,
    @SerialName("thumbnail_url") val thumbnailUrl: String? = null,
    val duration: Double? = null,
    val formats: List<ApiVideoFormat> = emptyList(),
)

@Serializable
data class ApiVideoFormat(
    val container: String? = null,
    val codec: String? = null,
    val bitrate: Int? = null,
    val url: String? = null,
    val width: Int? = null,
    val height: Int? = null,
)
