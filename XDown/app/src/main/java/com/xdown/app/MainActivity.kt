package com.xdown.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.runtime.LaunchedEffect
import com.xdown.app.ui.home.HomeScreen
import com.xdown.app.ui.theme.XDownTheme

class MainActivity : ComponentActivity() {
    private val viewModel: XDownViewModel by viewModels {
        val app = application as XDownApp
        XDownViewModel.factory(app.container.repository, app.container.downloader)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            XDownTheme {
                LaunchedEffect(intent) {
                    consumeSharedText(intent)
                }
                HomeScreen(viewModel = viewModel)
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
        viewModel.onQueryChange(text)
        viewModel.search()
    }
}
