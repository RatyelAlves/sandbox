package com.skydown.app.data

import android.content.ContentValues
import android.content.Context
import android.provider.MediaStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request

class MediaStoreDownloader(
    context: Context,
    private val client: OkHttpClient,
) : MediaDownloader {
    private val appContext = context.applicationContext
    override val destinationHint: String = "Pictures/SkyDown ou Movies/SkyDown"

    override suspend fun download(item: MediaItem) {
        withContext(Dispatchers.IO) {
            val request = Request.Builder()
                .url(item.downloadUrl)
                .header("User-Agent", NetworkModule.USER_AGENT)
                .build()
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    throw SkyDownException("Falha ao baixar ${item.fileName} (${response.code}).")
                }
                val body = response.body ?: throw SkyDownException("Arquivo vazio: ${item.fileName}")
                val mimeType = response.header("Content-Type")?.substringBefore(";")?.trim()
                    ?.takeIf { it.isNotBlank() && it != "application/octet-stream" }
                    ?: item.mimeType
                val fileName = fileNameFor(item.fileName, mimeType)
                val isVideo = item.kind != MediaKind.PHOTO
                val collection = if (isVideo) {
                    MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                } else {
                    MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                }
                val values = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
                    put(
                        MediaStore.MediaColumns.RELATIVE_PATH,
                        if (isVideo) "Movies/SkyDown" else "Pictures/SkyDown",
                    )
                    put(MediaStore.MediaColumns.IS_PENDING, 1)
                }
                val resolver = appContext.contentResolver
                val uri = resolver.insert(collection, values)
                    ?: throw SkyDownException("Não foi possível criar o arquivo $fileName.")
                try {
                    resolver.openOutputStream(uri)?.use { output ->
                        body.byteStream().copyTo(output)
                    } ?: throw SkyDownException("Não foi possível gravar $fileName.")
                    values.clear()
                    values.put(MediaStore.MediaColumns.IS_PENDING, 0)
                    resolver.update(uri, values, null, null)
                } catch (error: Exception) {
                    resolver.delete(uri, null, null)
                    throw error
                }
            }
        }
    }

    private fun fileNameFor(original: String, mimeType: String): String {
        val ext = when (mimeType.lowercase()) {
            "image/png" -> "png"
            "image/webp" -> "webp"
            "image/gif" -> "gif"
            "image/jpeg", "image/jpg" -> "jpg"
            "video/mp4" -> "mp4"
            "video/webm" -> "webm"
            else -> return original
        }
        val base = original.substringBeforeLast('.')
        return "$base.$ext"
    }
}
