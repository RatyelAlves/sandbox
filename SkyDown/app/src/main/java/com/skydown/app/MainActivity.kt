package com.skydown.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.runtime.LaunchedEffect
import android.graphics.Color
import com.skydown.app.ui.home.HomeScreen
import com.skydown.app.ui.theme.SkyDownTheme

class MainActivity : ComponentActivity() {
    private val viewModel: SkyDownAndroidViewModel by viewModels {
        val app = application as SkyDownApp
        SkyDownAndroidViewModel.factory(app.container.repository, app.container.downloader)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT),
        )
        setContent {
            SkyDownTheme {
                LaunchedEffect(intent) {
                    consumeSharedText(intent)
                }
                HomeScreen(viewModel = viewModel.session)
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        consumeSharedText(intent)
    }

    private fun consumeSharedText(intent: Intent?) {
        if (intent?.action != Intent.ACTION_SEND) return
        val text = intent.getStringExtra(Intent.EXTRA_TEXT) ?: return
        viewModel.session.onQueryChange(text)
        viewModel.session.search()
    }
}
