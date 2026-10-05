package com.xdown.app

import android.app.Application
import coil.ImageLoader
import coil.ImageLoaderFactory
import coil.decode.VideoFrameDecoder
import com.xdown.app.BuildConfig
import com.xdown.app.data.MediaRepository
import com.xdown.app.data.MediaStoreDownloader
import com.xdown.app.data.NetworkModule

class XDownApp : Application(), ImageLoaderFactory {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }

    override fun newImageLoader(): ImageLoader {
        return ImageLoader.Builder(this)
            .okHttpClient(container.client)
            .components { add(VideoFrameDecoder.Factory()) }
            .crossfade(true)
            .build()
    }
}

class AppContainer(app: Application) {
    val client = NetworkModule.okHttpClient(debug = BuildConfig.DEBUG)
    val repository = MediaRepository(NetworkModule.api(client))
    val downloader = MediaStoreDownloader(app, client)
}
