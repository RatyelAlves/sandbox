package com.skydown.desktop

import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Window
import androidx.compose.ui.window.WindowPosition
import androidx.compose.ui.window.application
import androidx.compose.ui.window.rememberWindowState
import coil3.ImageLoader
import coil3.compose.setSingletonImageLoaderFactory
import coil3.network.okhttp.OkHttpNetworkFetcherFactory
import com.skydown.app.SkyDownViewModel
import com.skydown.app.data.MediaRepository
import com.skydown.app.data.NetworkModule
import com.skydown.app.ui.theme.SkyDownTheme
import com.skydown.desktop.ui.HomeScreen
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.swing.Swing

fun main() = application {
    val client = remember { NetworkModule.okHttpClient(debug = false) }
    val viewModel = remember {
        SkyDownViewModel(
            scope = CoroutineScope(SupervisorJob() + Dispatchers.Swing),
            repository = MediaRepository(NetworkModule.api(client), NetworkModule.plcApi(client)),
            downloader = FileDownloader(client),
        )
    }
    setSingletonImageLoaderFactory { context ->
        ImageLoader.Builder(context)
            .components { add(OkHttpNetworkFetcherFactory(client)) }
            .build()
    }
    Window(
        onCloseRequest = ::exitApplication,
        title = "SkyDown",
        icon = painterResource("icon.png"),
        state = rememberWindowState(
            width = 1180.dp,
            height = 780.dp,
            position = WindowPosition.Aligned(Alignment.Center),
        ),
    ) {
        SkyDownTheme {
            HomeScreen(viewModel)
        }
    }
}
