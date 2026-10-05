package com.skydown.app

import android.app.Application
import com.skydown.app.BuildConfig
import com.skydown.app.data.MediaRepository
import com.skydown.app.data.MediaStoreDownloader
import com.skydown.app.data.NetworkModule

class SkyDownApp : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}

class AppContainer(app: Application) {
    private val client = NetworkModule.okHttpClient(debug = BuildConfig.DEBUG)
    val repository = MediaRepository(NetworkModule.api(client), NetworkModule.plcApi(client))
    val downloader = MediaStoreDownloader(app, client)
}
