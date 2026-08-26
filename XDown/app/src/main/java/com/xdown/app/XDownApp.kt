package com.xdown.app

import android.app.Application
import com.xdown.app.data.MediaRepository
import com.xdown.app.data.MediaStoreDownloader
import com.xdown.app.data.NetworkModule

class XDownApp : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}

class AppContainer(app: Application) {
    private val client = NetworkModule.okHttpClient()
    val repository = MediaRepository(NetworkModule.api(client))
    val downloader = MediaStoreDownloader(app, client)
}
