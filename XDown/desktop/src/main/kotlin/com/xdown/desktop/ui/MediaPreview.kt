package com.xdown.desktop.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.focusable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.Download
import androidx.compose.material.icons.automirrored.outlined.OpenInNew
import androidx.compose.material.icons.outlined.PlayArrow
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import com.xdown.app.data.MediaKind
import com.xdown.app.ui.theme.Hairline
import com.xdown.app.ui.theme.Ink
import com.xdown.app.ui.theme.InkCard
import com.xdown.app.ui.theme.Mute
import com.xdown.app.ui.theme.Snow
import com.xdown.app.ui.theme.Success
import com.xdown.app.ui.theme.XBlue
import com.xdown.app.ui.theme.XCyan
import com.xdown.app.data.MediaItem as XMedia
import java.awt.Desktop
import java.net.URI

@Composable
fun MediaPreview(
    items: List<XMedia>,
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
    val focus = remember { FocusRequester() }

    LaunchedEffect(Unit) {
        focus.requestFocus()
    }

    LaunchedEffect(pagerState.currentPage, items.size) {
        if (pagerState.currentPage >= items.lastIndex - 2) onNearEnd()
    }

    val current = items.getOrNull(pagerState.currentPage) ?: return
    val selected = current.id in selectedIds

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Ink)
            .focusRequester(focus)
            .focusable()
            .onPreviewKeyEvent { event ->
                if (event.type == KeyEventType.KeyDown && event.key == Key.Escape) {
                    onClose()
                    true
                } else {
                    false
                }
            },
    ) {
        HorizontalPager(
            state = pagerState,
            modifier = Modifier.fillMaxSize(),
        ) { page ->
            val item = items[page]
            if (item.kind == MediaKind.PHOTO) {
                FullscreenPhoto(item)
            } else {
                FullscreenVideo(item)
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
            onOpenVideo = { openUrl(current.downloadUrl) },
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
                    colors = listOf(Color(0xCC07080C), Color.Transparent),
                ),
            )
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
            color = XCyan,
            fontWeight = FontWeight.Bold,
            fontSize = 13.sp,
            modifier = Modifier.padding(end = 12.dp),
        )
    }
}

@Composable
private fun PreviewBottomBar(
    modifier: Modifier = Modifier,
    item: XMedia,
    selected: Boolean,
    isDownloading: Boolean,
    progress: Pair<Int, Int>?,
    onDownload: () -> Unit,
    onToggleSelect: () -> Unit,
    onOpenVideo: () -> Unit,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(
                Brush.verticalGradient(
                    colors = listOf(Color.Transparent, Color(0xE607080C)),
                ),
            )
            .padding(horizontal = 16.dp, vertical = 14.dp),
    ) {
        if (item.tweetText.isNotBlank()) {
            Text(
                item.tweetText,
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
                color = XCyan,
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
                            .background(Brush.horizontalGradient(listOf(XBlue, XCyan))),
                        contentAlignment = Alignment.Center,
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.Download, contentDescription = null, tint = Snow)
                            Spacer(Modifier.width(8.dp))
                            Text("Baixar este", fontWeight = FontWeight.Bold, color = Snow)
                        }
                    }
                }
                if (item.kind != MediaKind.PHOTO) {
                    Button(
                        onClick = onOpenVideo,
                        modifier = Modifier.height(50.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = InkCard),
                    ) {
                        Icon(Icons.AutoMirrored.Outlined.OpenInNew, contentDescription = null, tint = Snow)
                        Spacer(Modifier.width(6.dp))
                        Text("Abrir")
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
private fun FullscreenPhoto(item: XMedia) {
    AsyncImage(
        model = item.downloadUrl,
        contentDescription = item.tweetText,
        modifier = Modifier.fillMaxSize(),
        contentScale = ContentScale.Fit,
    )
}

@Composable
private fun FullscreenVideo(item: XMedia) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        val preview = item.imagePreviewUrl()
        if (preview != null) {
            AsyncImage(
                model = preview,
                contentDescription = item.tweetText,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Fit,
            )
        } else {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(InkCard),
            )
        }
        Icon(
            Icons.Outlined.PlayArrow,
            contentDescription = "Vídeo",
            tint = Snow.copy(alpha = 0.9f),
            modifier = Modifier
                .clip(CircleShape)
                .background(Color(0x99000000))
                .padding(18.dp),
        )
    }
}

private fun openUrl(url: String) {
    runCatching {
        if (Desktop.isDesktopSupported()) {
            Desktop.getDesktop().browse(URI(url))
        }
    }
}
