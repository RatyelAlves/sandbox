package com.skydown.app.ui.home

import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.Download
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.ui.PlayerView
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.skydown.app.data.MediaKind
import com.skydown.app.data.NetworkModule
import com.skydown.app.ui.theme.Hairline
import com.skydown.app.ui.theme.Ink
import com.skydown.app.ui.theme.InkCard
import com.skydown.app.ui.theme.Mute
import com.skydown.app.ui.theme.OverlayBottom
import com.skydown.app.ui.theme.OverlayTop
import com.skydown.app.ui.theme.SkyBlue
import com.skydown.app.ui.theme.SkyCyan
import com.skydown.app.ui.theme.Snow
import com.skydown.app.ui.theme.Success
import com.skydown.app.data.MediaItem as SkyMedia

@Composable
fun MediaPreview(
    items: List<SkyMedia>,
    startId: String,
    selectedIds: Set<String>,
    isDownloading: Boolean,
    progress: Pair<Int, Int>?,
    onClose: () -> Unit,
    onDownload: (String) -> Unit,
    onToggleSelect: (String) -> Unit,
    onNearEnd: () -> Unit,
) {
    if (items.isEmpty()) return
    val startIndex = items.indexOfFirst { it.id == startId }.coerceAtLeast(0)
    val pagerState = rememberPagerState(initialPage = startIndex, pageCount = { items.size })

    BackHandler(onBack = onClose)

    LaunchedEffect(pagerState.currentPage, items.size) {
        if (pagerState.currentPage >= items.lastIndex - 2) onNearEnd()
    }

    val current = items.getOrNull(pagerState.currentPage) ?: return
    val selected = current.id in selectedIds

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Ink),
    ) {
        HorizontalPager(
            state = pagerState,
            modifier = Modifier.fillMaxSize(),
        ) { page ->
            val item = items[page]
            val active = page == pagerState.currentPage
            if (item.kind == MediaKind.PHOTO) {
                FullscreenPhoto(item)
            } else {
                FullscreenVideo(url = item.playbackUrl, previewUrl = item.previewUrl, play = active)
            }
        }

        PreviewTopBar(
            modifier = Modifier.align(Alignment.TopCenter),
            index = pagerState.currentPage + 1,
            total = items.size,
            kind = current.kind,
            onClose = onClose,
        )

        PreviewBottomBar(
            modifier = Modifier.align(Alignment.BottomCenter),
            item = current,
            selected = selected,
            isDownloading = isDownloading,
            progress = progress,
            onDownload = { onDownload(current.id) },
            onToggleSelect = { onToggleSelect(current.id) },
        )
    }
}

@Composable
private fun PreviewTopBar(
    modifier: Modifier = Modifier,
    index: Int,
    total: Int,
    kind: MediaKind,
    onClose: () -> Unit,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(
                Brush.verticalGradient(
                    colors = listOf(OverlayTop, Color.Transparent),
                ),
            )
            .statusBarsPadding()
            .padding(horizontal = 8.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        IconButton(onClick = onClose) {
            Icon(Icons.Outlined.Close, contentDescription = "Fechar", tint = Snow)
        }
        Text(
            "$index / $total",
            color = Snow,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.weight(1f),
        )
        Text(
            when (kind) {
                MediaKind.PHOTO -> "Foto"
                MediaKind.VIDEO -> "Vídeo"
                MediaKind.GIF -> "GIF"
            },
            color = SkyCyan,
            fontWeight = FontWeight.Bold,
            fontSize = 13.sp,
            modifier = Modifier.padding(end = 12.dp),
        )
    }
}

@Composable
private fun PreviewBottomBar(
    modifier: Modifier = Modifier,
    item: SkyMedia,
    selected: Boolean,
    isDownloading: Boolean,
    progress: Pair<Int, Int>?,
    onDownload: () -> Unit,
    onToggleSelect: () -> Unit,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(
                Brush.verticalGradient(
                    colors = listOf(Color.Transparent, OverlayBottom),
                ),
            )
            .navigationBarsPadding()
            .padding(horizontal = 16.dp, vertical = 14.dp),
    ) {
        if (item.postText.isNotBlank()) {
            Text(
                item.postText,
                color = Snow,
                maxLines = 3,
                overflow = TextOverflow.Ellipsis,
                fontSize = 14.sp,
                modifier = Modifier.padding(bottom = 12.dp),
            )
        }
        if (isDownloading && progress != null) {
            Text(
                "Baixando ${progress.first} de ${progress.second}",
                color = Mute,
                fontSize = 13.sp,
            )
            Spacer(Modifier.height(8.dp))
            LinearProgressIndicator(
                progress = {
                    progress.first.toFloat() / progress.second.coerceAtLeast(1).toFloat()
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(CircleShape),
                color = SkyCyan,
                trackColor = Hairline,
            )
        } else {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Button(
                    onClick = onDownload,
                    modifier = Modifier
                        .weight(1f)
                        .height(50.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                    contentPadding = PaddingValues(),
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Brush.horizontalGradient(listOf(SkyBlue, SkyCyan))),
                        contentAlignment = Alignment.Center,
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.Download, contentDescription = null, tint = Snow)
                            Spacer(Modifier.width(8.dp))
                            Text("Baixar este", fontWeight = FontWeight.Bold, color = Snow)
                        }
                    }
                }
                Button(
                    onClick = onToggleSelect,
                    modifier = Modifier.height(50.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = InkCard),
                ) {
                    Icon(
                        Icons.Outlined.CheckCircle,
                        contentDescription = null,
                        tint = if (selected) Success else Mute,
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(if (selected) "Na lista" else "Selecionar")
                }
            }
        }
    }
}

@Composable
private fun FullscreenPhoto(item: SkyMedia) {
    AsyncImage(
        model = ImageRequest.Builder(LocalContext.current)
            .data(item.downloadUrl)
            .crossfade(true)
            .addHeader("User-Agent", NetworkModule.USER_AGENT)
            .build(),
        contentDescription = item.postText,
        modifier = Modifier.fillMaxSize(),
        contentScale = ContentScale.Fit,
    )
}

@Composable
private fun FullscreenVideo(url: String, previewUrl: String, play: Boolean) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        AsyncImage(
            model = previewUrl,
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Fit,
        )
        if (play) {
            val context = LocalContext.current
            val player = remember(url) {
                val http = DefaultHttpDataSource.Factory()
                    .setUserAgent(NetworkModule.USER_AGENT)
                ExoPlayer.Builder(context)
                    .setMediaSourceFactory(DefaultMediaSourceFactory(http))
                    .build()
                    .apply {
                        repeatMode = Player.REPEAT_MODE_OFF
                        setMediaItem(MediaItem.fromUri(url))
                        prepare()
                        playWhenReady = true
                    }
            }
            DisposableEffect(player) {
                onDispose { player.release() }
            }
            AndroidView(
                factory = { ctx ->
                    PlayerView(ctx).apply {
                        useController = true
                        layoutParams = FrameLayout.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT,
                        )
                    }
                },
                update = { view -> view.player = player },
                modifier = Modifier.fillMaxSize(),
            )
        }
    }
}
