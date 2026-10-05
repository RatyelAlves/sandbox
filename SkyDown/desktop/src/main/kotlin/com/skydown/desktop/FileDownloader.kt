package com.skydown.desktop

import com.skydown.app.data.MediaDownloader
import com.skydown.app.data.MediaItem
import com.skydown.app.data.NetworkModule
import com.skydown.app.data.SkyDownException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardCopyOption

class FileDownloader(
    private val client: OkHttpClient,
) : MediaDownloader {
    override val destinationHint: String = "Downloads/SkyDown"

    private val folder: Path = Path.of(
        System.getProperty("user.home"),
        "Downloads",
        "SkyDown",
    )

    override suspend fun download(item: MediaItem) {
        withContext(Dispatchers.IO) {
            Files.createDirectories(folder)
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
                val target = folder.resolve(safeFileName(fileNameFor(item.fileName, mimeType)))
                body.byteStream().use { input ->
                    Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING)
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

    private fun safeFileName(name: String): String {
        val cleaned = name.replace(Regex("""[<>:"/\\|?*]"""), "_").trim()
        return cleaned.take(180).ifBlank { "skydown.bin" }
    }
}
