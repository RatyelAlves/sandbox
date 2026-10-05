package com.xdown.app

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.runtime.LaunchedEffect
import com.xdown.app.ui.home.HomeScreen
import com.xdown.app.ui.theme.XDownTheme

class MainActivity : ComponentActivity() {
    private val viewModel: XDownAndroidViewModel by viewModels {
        val app = application as XDownApp
        XDownAndroidViewModel.factory(app.container.repository, app.container.downloader)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.dark(Color.TRANSPARENT),
        )
        setContent {
            XDownTheme {
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
