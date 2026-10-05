package com.xdown.app.data

interface MediaDownloader {
    val destinationHint: String
    suspend fun download(item: MediaItem)
}
