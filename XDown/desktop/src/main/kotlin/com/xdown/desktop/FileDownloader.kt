package com.xdown.desktop

import com.xdown.app.data.MediaDownloader
import com.xdown.app.data.MediaItem
import com.xdown.app.data.NetworkModule
import com.xdown.app.data.XDownException
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
    override val destinationHint: String = "Downloads/XDown"

    private val folder: Path = Path.of(
        System.getProperty("user.home"),
        "Downloads",
        "XDown",
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
                    throw XDownException("Falha ao baixar ${item.fileName} (${response.code}).")
                }
                val body = response.body ?: throw XDownException("Arquivo vazio: ${item.fileName}")
                val target = folder.resolve(safeFileName(item.fileName))
                body.byteStream().use { input ->
                    Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING)
                }
            }
        }
    }

    private fun safeFileName(name: String): String {
        val cleaned = name.replace(Regex("""[<>:"/\\|?*]"""), "_").trim()
        return cleaned.take(180).ifBlank { "xdown.bin" }
    }
}
