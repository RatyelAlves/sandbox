package com.skydown.app.data

import retrofit2.converter.kotlinx.serialization.asConverterFactory
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query
import java.util.concurrent.TimeUnit

interface BskyApi {
    @GET("xrpc/app.bsky.actor.getProfile")
    suspend fun profile(@Query("actor") actor: String): Response<BskyProfile>

    @GET("xrpc/app.bsky.feed.getAuthorFeed")
    suspend fun authorFeed(
        @Query("actor") actor: String,
        @Query("filter") filter: String = "posts_with_media",
        @Query("limit") limit: Int = 50,
        @Query("cursor") cursor: String? = null,
    ): Response<BskyAuthorFeed>
}

interface PlcApi {
    @GET("{did}")
    suspend fun didDoc(@Path(value = "did", encoded = true) did: String): Response<DidDoc>
}

object NetworkModule {
    const val USER_AGENT = "SkyDown/1.0 (personal media backup)"
    const val FALLBACK_PDS = "https://bsky.social"

    val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        coerceInputValues = true
        explicitNulls = false
    }

    fun okHttpClient(debug: Boolean = false): OkHttpClient {
        val logging = HttpLoggingInterceptor().apply {
            level = if (debug) {
                HttpLoggingInterceptor.Level.BASIC
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }
        return OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .writeTimeout(60, TimeUnit.SECONDS)
            .followRedirects(true)
            .followSslRedirects(true)
            .addInterceptor { chain ->
                val request = chain.request().newBuilder()
                    .header("User-Agent", USER_AGENT)
                    .build()
                chain.proceed(request)
            }
            .addInterceptor(logging)
            .build()
    }

    fun api(client: OkHttpClient): BskyApi {
        return Retrofit.Builder()
            .baseUrl("https://public.api.bsky.app/")
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
            .create(BskyApi::class.java)
    }

    fun plcApi(client: OkHttpClient): PlcApi {
        return Retrofit.Builder()
            .baseUrl("https://plc.directory/")
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
            .create(PlcApi::class.java)
    }
}
