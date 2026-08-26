package com.xdown.app.data

import retrofit2.converter.kotlinx.serialization.asConverterFactory
import com.xdown.app.BuildConfig
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

interface FxTwitterApi {
    @GET("2/profile/{handle}")
    suspend fun profile(@Path("handle") handle: String): Response<UserResponse>

    @GET("2/profile/{handle}/media")
    suspend fun media(
        @Path("handle") handle: String,
        @Query("count") count: Int = 50,
        @Query("cursor") cursor: String? = null,
    ): Response<SearchResponse>
}

object NetworkModule {
    const val USER_AGENT = "XDown/1.0 (Android; personal media backup)"

    val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        coerceInputValues = true
        explicitNulls = false
    }

    fun okHttpClient(): OkHttpClient {
        val logging = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BASIC
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }
        return OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .writeTimeout(60, TimeUnit.SECONDS)
            .addInterceptor { chain ->
                val request = chain.request().newBuilder()
                    .header("User-Agent", USER_AGENT)
                    .header("Accept", "application/json")
                    .build()
                chain.proceed(request)
            }
            .addInterceptor(logging)
            .build()
    }

    fun api(client: OkHttpClient): FxTwitterApi {
        return Retrofit.Builder()
            .baseUrl("https://api.fxtwitter.com/")
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
            .create(FxTwitterApi::class.java)
    }
}
