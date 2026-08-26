package com.xdown.app.data

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
) {
    private val appContext = context.applicationContext

    suspend fun download(item: MediaItem) = withContext(Dispatchers.IO) {
        val request = Request.Builder()
            .url(item.downloadUrl)
            .header("User-Agent", NetworkModule.USER_AGENT)
            .build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw XDownException("Falha ao baixar ${item.fileName} (${response.code}).")
            }
            val body = response.body ?: throw XDownException("Arquivo vazio: ${item.fileName}")
            val isVideo = item.kind != MediaKind.PHOTO
            val collection = if (isVideo) {
                MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
            } else {
                MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
            }
            val values = ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, item.fileName)
                put(MediaStore.MediaColumns.MIME_TYPE, item.mimeType)
                put(
                    MediaStore.MediaColumns.RELATIVE_PATH,
                    if (isVideo) "Movies/XDown" else "Pictures/XDown",
                )
                put(MediaStore.MediaColumns.IS_PENDING, 1)
            }
            val resolver = appContext.contentResolver
            val uri = resolver.insert(collection, values)
                ?: throw XDownException("Não foi possível criar o arquivo ${item.fileName}.")
            try {
                resolver.openOutputStream(uri)?.use { output ->
                    body.byteStream().copyTo(output)
                } ?: throw XDownException("Não foi possível gravar ${item.fileName}.")
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
