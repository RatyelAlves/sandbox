package com.xdown.desktop

import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.unit.dp
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.window.Window
import androidx.compose.ui.window.WindowPosition
import androidx.compose.ui.window.application
import androidx.compose.ui.window.rememberWindowState
import coil3.ImageLoader
import coil3.compose.setSingletonImageLoaderFactory
import coil3.network.okhttp.OkHttpNetworkFetcherFactory
import com.xdown.app.XDownViewModel
import com.xdown.app.data.MediaRepository
import com.xdown.app.data.NetworkModule
import com.xdown.app.ui.theme.XDownTheme
import com.xdown.desktop.ui.HomeScreen
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.swing.Swing

fun main() = application {
    val client = remember { NetworkModule.okHttpClient(debug = false) }
    val viewModel = remember {
        XDownViewModel(
            scope = CoroutineScope(SupervisorJob() + Dispatchers.Swing),
            repository = MediaRepository(NetworkModule.api(client)),
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
        title = "XDown",
        icon = painterResource("icon.png"),
        state = rememberWindowState(
            width = 1180.dp,
            height = 780.dp,
            position = WindowPosition.Aligned(Alignment.Center),
        ),
    ) {
        XDownTheme {
            HomeScreen(viewModel)
        }
    }
}
