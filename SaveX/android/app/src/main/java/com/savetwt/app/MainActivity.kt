package com.savetwt.app

import android.app.DownloadManager
import android.content.ClipboardManager
import android.content.Context
import android.media.MediaPlayer
import android.media.PlaybackParams
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.widget.VideoView
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import coil.compose.AsyncImage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

private val Blue = Color(0xFF00BA7C)

private data class Palette(
    val bg: Color,
    val text: Color,
    val muted: Color,
    val line: Color,
    val header: Color,
    val input: Color,
    val badgeBg: Color,
    val badgeText: Color,
    val danger: Color,
)

private val DarkPalette = Palette(
    bg = Color(0xFF07080B),
    text = Color.White,
    muted = Color(0xFF9AA3AD),
    line = Color(0xFF243038),
    header = Color(0xC0101216),
    input = Color(0xC00C0E12),
    badgeBg = Color(0xFF06381F),
    badgeText = Color(0xFF5EE0A8),
    danger = Color(0xFFFF8D8D),
)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent { SaveTwtApp() }
    }
}

@Composable
private fun SaveTwtApp() {
    val context = LocalContext.current
    val density = LocalDensity.current
    val videoFromTop = with(density) { WindowInsets.statusBars.getTop(this).toDp() } + 86.dp
    val buttonFromBottom = (
        videoFromTop - with(density) { WindowInsets.navigationBars.getBottom(this).toDp() } - 6.dp
    ).coerceAtLeast(0.dp)
    val colors = DarkPalette
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val activity = view.context as ComponentActivity
            val bar = SystemBarStyle.dark(android.graphics.Color.TRANSPARENT)
            activity.enableEdgeToEdge(statusBarStyle = bar, navigationBarStyle = bar)
        }
    }
    var showSplash by remember { mutableStateOf(true) }
    var link by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var videos by remember { mutableStateOf<List<Video>>(emptyList()) }
    var index by remember { mutableIntStateOf(0) }
    var playing by remember { mutableStateOf(false) }
    var fullscreen by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    fun resetPlayer() {
        playing = false
        fullscreen = false
    }

    fun fetch() {
        if (busy) return
        scope.launch {
            busy = true
            error = null
            try {
                val found = withContext(Dispatchers.IO) { Twitter.fetch(link) }
                if (found.isEmpty()) {
                    error = "This post has no video."
                } else {
                    videos = found
                    index = 0
                    resetPlayer()
                }
            } catch (thrown: Exception) {
                error = thrown.message ?: "Could not get this video."
            } finally {
                busy = false
            }
        }
    }

    Box(Modifier.fillMaxSize().background(if (fullscreen) Color.Black else colors.bg)) {
        if (!fullscreen) {
            Image(
                painter = painterResource(R.drawable.bg_tech),
                contentDescription = null,
                modifier = Modifier
                    .fillMaxSize()
                    .windowInsetsPadding(WindowInsets.safeDrawing),
                contentScale = ContentScale.FillBounds,
            )
        }
    Column(
        modifier = Modifier
            .fillMaxSize()
            .windowInsetsPadding(WindowInsets.safeDrawing)
            .padding(
                start = if (fullscreen) 0.dp else 10.dp,
                end = if (fullscreen) 0.dp else 10.dp,
                top = if (fullscreen) 0.dp else 6.dp,
                bottom = if (fullscreen) 0.dp else 6.dp,
            ),
    ) {
        if (!fullscreen) {
            Spacer(Modifier.height(80.dp))
        }
        if (videos.isEmpty()) {
            PastePane(
                colors = colors,
                link = link,
                busy = busy,
                error = error,
                onLink = { link = it },
                onFetch = { fetch() },
                modifier = Modifier.weight(1f),
            )
        } else {
            val video = videos[index]
            if (fullscreen) {
                Preview(
                    video = video,
                    playing = playing,
                    fullscreen = true,
                    onPlay = { playing = true },
                    onFullscreen = { fullscreen = !fullscreen },
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth(),
                )
            } else {
                BoxWithConstraints(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                ) {
                    val table = 6.dp + 26.dp + 46.dp * video.formats.size
                    val pager = if (videos.size > 1) 32.dp else 0.dp
                    val room = (maxHeight - table - pager).coerceAtLeast(120.dp)
                    val side = minOf(maxWidth, room)
                    Column(
                        modifier = Modifier
                            .align(Alignment.TopCenter)
                            .width(side),
                    ) {
                        Preview(
                            video = video,
                            playing = playing,
                            fullscreen = false,
                            onPlay = { playing = true },
                            onFullscreen = { fullscreen = !fullscreen },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(side),
                        )
                        if (videos.size > 1) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 6.dp),
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                            ) {
                                videos.forEachIndexed { itemIndex, _ ->
                                    val selected = itemIndex == index
                                    Text(
                                        text = "${itemIndex + 1}",
                                        color = if (selected) Color.White else colors.text,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        modifier = Modifier
                                            .clip(CircleShape)
                                            .background(if (selected) Blue else Color.Transparent)
                                            .border(1.dp, if (selected) Blue else colors.line, CircleShape)
                                            .clickable {
                                                index = itemIndex
                                                resetPlayer()
                                            }
                                            .padding(horizontal = 10.dp, vertical = 2.dp),
                                    )
                                }
                            }
                        }
                        QualityTable(
                            colors = colors,
                            formats = video.formats,
                            onDownload = { quality -> download(context, video.title, quality) },
                            modifier = Modifier
                                .padding(top = 6.dp)
                                .fillMaxWidth(),
                        )
                    }
                }
                ActionButton(
                    text = "Download Another Video",
                    plus = true,
                    enabled = true,
                    onClick = {
                        videos = emptyList()
                        link = ""
                        error = null
                        resetPlayer()
                    },
                    modifier = Modifier.padding(top = 8.dp, bottom = buttonFromBottom),
                )
            }
        }
    }
    if (showSplash) {
        FullLogoSplash(onFinished = { showSplash = false })
    }
    }
}

@Composable
private fun FullLogoSplash(onFinished: () -> Unit) {
    LaunchedEffect(Unit) {
        delay(900)
        onFinished()
    }
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black),
        contentAlignment = Alignment.Center,
    ) {
        Image(
            painter = painterResource(R.drawable.ic_launcher),
            contentDescription = null,
            contentScale = ContentScale.Fit,
            modifier = Modifier.size(200.dp),
        )
    }
}

@Composable
private fun PastePane(
    colors: Palette,
    link: String,
    busy: Boolean,
    error: String?,
    onLink: (String) -> Unit,
    onFetch: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val focus = LocalFocusManager.current
    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(6.dp))
                .background(colors.input)
                .border(1.dp, Blue.copy(alpha = 0.45f), RoundedCornerShape(6.dp))
                .padding(start = 12.dp, end = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            androidx.compose.foundation.text.BasicTextField(
                value = link,
                onValueChange = onLink,
                singleLine = true,
                textStyle = androidx.compose.ui.text.TextStyle(color = colors.text, fontSize = 14.sp),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Go),
                keyboardActions = KeyboardActions(onGo = {
                    focus.clearFocus()
                    onFetch()
                }),
                modifier = Modifier
                    .weight(1f)
                    .padding(vertical = 12.dp),
                decorationBox = { inner ->
                    if (link.isEmpty()) {
                        Text("https://x.com/user/status/123...", color = Color(0xFF8B909A), fontSize = 14.sp)
                    }
                    inner()
                },
            )
            Box(
                modifier = Modifier
                    .padding(vertical = 4.dp)
                    .size(36.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(Blue)
                    .clickable {
                        val clipboard = context.getSystemService(ClipboardManager::class.java)
                        val text = clipboard.primaryClip?.getItemAt(0)?.coerceToText(context)?.toString()?.trim().orEmpty()
                        if (text.isNotEmpty()) onLink(text)
                    },
                contentAlignment = Alignment.Center,
            ) {
                ClipboardMark(Modifier.size(18.dp))
            }
        }
        if (!error.isNullOrBlank()) {
            Text(
                text = error,
                color = colors.danger,
                fontSize = 12.sp,
                textAlign = TextAlign.Center,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.padding(top = 6.dp),
            )
        }
        ActionButton(
            text = if (busy) "Fetching..." else "Get Video",
            plus = false,
            enabled = !busy,
            onClick = {
                focus.clearFocus()
                onFetch()
            },
            modifier = Modifier.padding(top = 8.dp),
        )
    }
}

@Composable
private fun Preview(
    video: Video,
    playing: Boolean,
    fullscreen: Boolean,
    onPlay: () -> Unit,
    onFullscreen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val preview = video.formats.firstOrNull { minOf(it.width, it.height) <= 720 } ?: video.formats.last()
    var showControls by remember(preview.url) { mutableStateOf(true) }
    var position by remember(preview.url) { mutableIntStateOf(0) }
    var duration by remember(preview.url) { mutableIntStateOf(0) }
    var paused by remember(preview.url) { mutableStateOf(false) }
    var muted by remember(preview.url) { mutableStateOf(false) }
    var seeking by remember(preview.url) { mutableStateOf(false) }
    var speed by remember(preview.url) { mutableStateOf(1f) }
    var menuOpen by remember(preview.url) { mutableStateOf(false) }
    var player by remember(preview.url) { mutableStateOf<MediaPlayer?>(null) }
    var videoView by remember(preview.url) { mutableStateOf<VideoView?>(null) }

    LaunchedEffect(playing, preview.url, seeking) {
        while (playing) {
            val view = videoView
            if (view != null && !seeking) {
                position = view.currentPosition
                if (view.duration > 0) duration = view.duration
            }
            delay(300)
        }
    }
    LaunchedEffect(showControls, paused, playing) {
        if (playing && showControls && !paused) {
            delay(3000)
            showControls = false
        }
    }
    LaunchedEffect(muted, player) {
        player?.setVolume(if (muted) 0f else 1f, if (muted) 0f else 1f)
    }
    LaunchedEffect(speed, player) {
        val media = player ?: return@LaunchedEffect
        try {
            media.playbackParams = PlaybackParams().setSpeed(speed)
        } catch (_: RuntimeException) {
        }
    }

    Box(
        modifier = modifier
            .then(
                if (fullscreen) {
                    Modifier.background(Color.Black)
                } else {
                    Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .background(Color.Black)
                        .border(1.dp, Blue.copy(alpha = 0.7f), RoundedCornerShape(4.dp))
                },
            )
            .clickable(enabled = playing) { showControls = !showControls },
        contentAlignment = Alignment.Center,
    ) {
            if (!playing) {
                if (video.thumbnail != null) {
                    AsyncImage(
                        model = video.thumbnail,
                        contentDescription = "Video preview",
                        contentScale = ContentScale.Fit,
                        modifier = Modifier.fillMaxSize(),
                    )
                }
                Box(
                    modifier = Modifier
                        .size(74.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.55f))
                        .clickable(onClick = onPlay),
                    contentAlignment = Alignment.Center,
                ) {
                    PlayGlyph(Color.Black, Modifier.size(34.dp).offset(x = 3.dp))
                }
            } else {
                AndroidView(
                    factory = { context ->
                        VideoView(context).apply {
                            setOnPreparedListener { media ->
                                player = media
                                duration = media.duration
                                media.setVolume(if (muted) 0f else 1f, if (muted) 0f else 1f)
                                if (!paused) start()
                            }
                            setOnCompletionListener {
                                paused = true
                                showControls = true
                            }
                        }
                    },
                    update = { view ->
                        videoView = view
                        if (view.tag != preview.url) {
                            view.tag = preview.url
                            view.setVideoURI(Uri.parse(preview.url))
                        }
                    },
                    modifier = Modifier.fillMaxSize(),
                )
                if (showControls) {
                    PlayerBar(
                        paused = paused,
                        muted = muted,
                        position = position,
                        duration = duration,
                        menuOpen = menuOpen,
                        onTogglePlay = {
                            val view = videoView ?: return@PlayerBar
                            if (view.isPlaying) {
                                view.pause()
                                paused = true
                            } else {
                                view.start()
                                paused = false
                            }
                            showControls = true
                        },
                        onSeek = {
                            seeking = true
                            position = it
                            videoView?.seekTo(it)
                        },
                        onSeekFinished = { seeking = false },
                        onToggleMute = { muted = !muted },
                        onToggleFullscreen = onFullscreen,
                        onMenu = { menuOpen = true },
                        onDismissMenu = { menuOpen = false },
                        onSpeed = { chosen ->
                            speed = chosen
                            menuOpen = false
                        },
                        modifier = Modifier.align(Alignment.BottomCenter),
                    )
                }
            }
        }
    }

@Composable
private fun PlayerBar(
    paused: Boolean,
    muted: Boolean,
    position: Int,
    duration: Int,
    menuOpen: Boolean,
    onTogglePlay: () -> Unit,
    onSeek: (Int) -> Unit,
    onSeekFinished: () -> Unit,
    onToggleMute: () -> Unit,
    onToggleFullscreen: () -> Unit,
    onMenu: () -> Unit,
    onDismissMenu: () -> Unit,
    onSpeed: (Float) -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(Color.Black.copy(alpha = 0.72f))
            .padding(horizontal = 6.dp, vertical = 2.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(Modifier.size(28.dp).clickable(onClick = onTogglePlay), contentAlignment = Alignment.Center) {
            if (paused) PlayGlyph(Color.White, Modifier.size(14.dp)) else PauseGlyph(Modifier.size(14.dp))
        }
        Text(
            text = "${clock(position)} / ${clock(duration)}",
            color = Color.White,
            fontSize = 11.sp,
            maxLines = 1,
        )
        SeekTrack(
            position = position,
            duration = duration,
            onSeek = onSeek,
            onSeekFinished = onSeekFinished,
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 4.dp),
        )
        Box(Modifier.size(28.dp).clickable(onClick = onToggleMute), contentAlignment = Alignment.Center) {
            VolumeGlyph(muted, Modifier.size(16.dp))
        }
        Box(Modifier.size(28.dp).clickable(onClick = onToggleFullscreen), contentAlignment = Alignment.Center) {
            FullscreenGlyph(Modifier.size(15.dp))
        }
        Box(Modifier.size(28.dp), contentAlignment = Alignment.Center) {
            Box(Modifier.fillMaxSize().clickable(onClick = onMenu), contentAlignment = Alignment.Center) {
                MoreGlyph(Modifier.size(16.dp))
            }
            DropdownMenu(expanded = menuOpen, onDismissRequest = onDismissMenu) {
                listOf(0.5f, 1f, 1.25f, 1.5f, 2f).forEach { rate ->
                    DropdownMenuItem(
                        text = { Text(if (rate == 1f) "Normal" else "${rate}x") },
                        onClick = { onSpeed(rate) },
                    )
                }
            }
        }
    }
}

private fun clock(ms: Int): String {
    val total = (ms.coerceAtLeast(0) / 1000)
    return "%d:%02d".format(total / 60, total % 60)
}

@Composable
private fun SeekTrack(
    position: Int,
    duration: Int,
    onSeek: (Int) -> Unit,
    onSeekFinished: () -> Unit,
    modifier: Modifier = Modifier,
) {
    fun seekAt(width: Int, x: Float) {
        val span = width.coerceAtLeast(1).toFloat()
        val ratio = (x / span).coerceIn(0f, 1f)
        onSeek((ratio * duration.coerceAtLeast(1)).toInt())
    }
    Box(
        modifier = modifier
            .height(22.dp)
            .pointerInput(duration) {
                detectTapGestures { offset ->
                    seekAt(size.width, offset.x)
                    onSeekFinished()
                }
            }
            .pointerInput(duration) {
                detectDragGestures(
                    onDragStart = { offset -> seekAt(size.width, offset.x) },
                    onDragEnd = { onSeekFinished() },
                    onDragCancel = { onSeekFinished() },
                    onDrag = { change, _ -> seekAt(size.width, change.position.x) },
                )
            },
        contentAlignment = Alignment.CenterStart,
    ) {
        Canvas(Modifier.fillMaxWidth().height(3.dp)) {
            val ratio = if (duration <= 0) 0f else (position.toFloat() / duration).coerceIn(0f, 1f)
            drawRoundRect(
                color = Color.White.copy(alpha = 0.35f),
                size = size,
                cornerRadius = CornerRadius(size.height / 2f),
            )
            drawRoundRect(
                color = Color.White,
                size = Size(size.width * ratio, size.height),
                cornerRadius = CornerRadius(size.height / 2f),
            )
        }
    }
}

@Composable
private fun PlayGlyph(color: Color, modifier: Modifier) {
    Canvas(modifier) {
        val path = Path().apply {
            moveTo(size.width * 0.22f, size.height * 0.12f)
            lineTo(size.width * 0.88f, size.height * 0.5f)
            lineTo(size.width * 0.22f, size.height * 0.88f)
            close()
        }
        drawPath(path, color)
    }
}

@Composable
private fun PauseGlyph(modifier: Modifier) {
    Canvas(modifier) {
        drawRoundRect(
            color = Color.White,
            topLeft = Offset(size.width * 0.12f, size.height * 0.08f),
            size = Size(size.width * 0.28f, size.height * 0.84f),
            cornerRadius = CornerRadius(2.dp.toPx()),
        )
        drawRoundRect(
            color = Color.White,
            topLeft = Offset(size.width * 0.60f, size.height * 0.08f),
            size = Size(size.width * 0.28f, size.height * 0.84f),
            cornerRadius = CornerRadius(2.dp.toPx()),
        )
    }
}

@Composable
private fun VolumeGlyph(muted: Boolean, modifier: Modifier) {
    Canvas(modifier) {
        val path = Path().apply {
            moveTo(size.width * 0.08f, size.height * 0.38f)
            lineTo(size.width * 0.28f, size.height * 0.38f)
            lineTo(size.width * 0.48f, size.height * 0.18f)
            lineTo(size.width * 0.48f, size.height * 0.82f)
            lineTo(size.width * 0.28f, size.height * 0.62f)
            lineTo(size.width * 0.08f, size.height * 0.62f)
            close()
        }
        drawPath(path, Color.White)
        if (muted) {
            drawLine(
                Color.White,
                Offset(size.width * 0.58f, size.height * 0.32f),
                Offset(size.width * 0.92f, size.height * 0.68f),
                strokeWidth = 1.6.dp.toPx(),
                cap = StrokeCap.Round,
            )
            drawLine(
                Color.White,
                Offset(size.width * 0.92f, size.height * 0.32f),
                Offset(size.width * 0.58f, size.height * 0.68f),
                strokeWidth = 1.6.dp.toPx(),
                cap = StrokeCap.Round,
            )
        } else {
            drawArc(
                color = Color.White,
                startAngle = -50f,
                sweepAngle = 100f,
                useCenter = false,
                topLeft = Offset(size.width * 0.42f, size.height * 0.28f),
                size = Size(size.width * 0.36f, size.height * 0.44f),
                style = Stroke(width = 1.5.dp.toPx(), cap = StrokeCap.Round),
            )
        }
    }
}

@Composable
private fun FullscreenGlyph(modifier: Modifier) {
    Canvas(modifier) {
        val stroke = Stroke(width = 1.6.dp.toPx(), cap = StrokeCap.Round)
        val inset = size.width * 0.08f
        val arm = size.width * 0.34f
        drawLine(Color.White, Offset(inset, inset + arm), Offset(inset, inset), stroke.width, cap = StrokeCap.Round)
        drawLine(Color.White, Offset(inset, inset), Offset(inset + arm, inset), stroke.width, cap = StrokeCap.Round)
        drawLine(Color.White, Offset(size.width - inset - arm, inset), Offset(size.width - inset, inset), stroke.width, cap = StrokeCap.Round)
        drawLine(Color.White, Offset(size.width - inset, inset), Offset(size.width - inset, inset + arm), stroke.width, cap = StrokeCap.Round)
        drawLine(Color.White, Offset(inset, size.height - inset - arm), Offset(inset, size.height - inset), stroke.width, cap = StrokeCap.Round)
        drawLine(Color.White, Offset(inset, size.height - inset), Offset(inset + arm, size.height - inset), stroke.width, cap = StrokeCap.Round)
        drawLine(Color.White, Offset(size.width - inset - arm, size.height - inset), Offset(size.width - inset, size.height - inset), stroke.width, cap = StrokeCap.Round)
        drawLine(Color.White, Offset(size.width - inset, size.height - inset), Offset(size.width - inset, size.height - inset - arm), stroke.width, cap = StrokeCap.Round)
    }
}

@Composable
private fun MoreGlyph(modifier: Modifier) {
    Canvas(modifier) {
        val r = size.minDimension * 0.08f
        listOf(0.22f, 0.5f, 0.78f).forEach { y ->
            drawCircle(Color.White, radius = r, center = Offset(size.width / 2f, size.height * y))
        }
    }
}

@Composable
private fun ClipboardMark(modifier: Modifier) {
    Canvas(modifier) {
        drawRoundRect(
            color = Color.White,
            topLeft = Offset(size.width * 0.16f, size.height * 0.24f),
            size = Size(size.width * 0.68f, size.height * 0.64f),
            cornerRadius = CornerRadius(size.width * 0.08f),
            style = Stroke(width = 1.5.dp.toPx()),
        )
        drawRoundRect(
            color = Color.White,
            topLeft = Offset(size.width * 0.32f, size.height * 0.08f),
            size = Size(size.width * 0.36f, size.height * 0.22f),
            cornerRadius = CornerRadius(size.width * 0.06f),
        )
        drawLine(
            Color.White,
            Offset(size.width * 0.30f, size.height * 0.50f),
            Offset(size.width * 0.70f, size.height * 0.50f),
            strokeWidth = 1.4.dp.toPx(),
            cap = StrokeCap.Round,
        )
        drawLine(
            Color.White,
            Offset(size.width * 0.30f, size.height * 0.66f),
            Offset(size.width * 0.62f, size.height * 0.66f),
            strokeWidth = 1.4.dp.toPx(),
            cap = StrokeCap.Round,
        )
    }
}

@Composable
private fun QualityTable(
    colors: Palette,
    formats: List<Quality>,
    onDownload: (Quality) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(6.dp))
            .background(colors.header)
            .border(1.dp, Blue.copy(alpha = 0.4f), RoundedCornerShape(6.dp)),
    ) {
        QualityRow(colors, header = true, quality = null, onDownload = {})
        formats.forEach { quality ->
            QualityRow(colors, header = false, quality = quality, onDownload = { onDownload(quality) })
        }
    }
}

@Composable
private fun QualityRow(
    colors: Palette,
    header: Boolean,
    quality: Quality?,
    onDownload: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(if (header) 26.dp else 46.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Cell(if (header) "Format" else "MP4", header, colors, Modifier.width(58.dp))
        Cell(
            text = if (header) "Quality" else "${quality!!.width} × ${quality.height}",
            header = header,
            colors = colors,
            badge = if (header) null else quality!!.label,
            modifier = Modifier.weight(1.15f),
        )
        Box(
            modifier = Modifier
                .weight(1.2f)
                .fillMaxHeight()
                .border(width = 0.5.dp, color = colors.line),
            contentAlignment = Alignment.Center,
        ) {
            if (header) {
                Text("Download Link", color = colors.muted, fontSize = 11.sp, fontWeight = FontWeight.Medium)
            } else {
                Row(
                    modifier = Modifier
                        .padding(horizontal = 6.dp, vertical = 4.dp)
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(4.dp))
                        .background(Blue)
                        .clickable(onClick = onDownload)
                        .padding(vertical = 6.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    DownloadGlyph()
                    Text("Download", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(start = 4.dp))
                }
            }
        }
    }
}

@Composable
private fun Cell(
    text: String,
    header: Boolean,
    colors: Palette,
    modifier: Modifier,
    badge: String? = null,
) {
    Column(
        modifier = modifier
            .fillMaxHeight()
            .border(width = 0.5.dp, color = colors.line)
            .padding(horizontal = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(
            text = text,
            color = if (header) colors.muted else colors.text,
            fontSize = if (header) 11.sp else 12.sp,
            fontWeight = if (header) FontWeight.Medium else FontWeight.Bold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
        if (badge != null) {
            Text(
                text = badge,
                color = colors.badgeText,
                fontSize = 9.sp,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier
                    .padding(top = 2.dp)
                    .clip(CircleShape)
                    .background(colors.badgeBg)
                    .padding(horizontal = 6.dp, vertical = 1.dp),
            )
        }
    }
}

@Composable
private fun ActionButton(
    text: String,
    plus: Boolean,
    enabled: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(40.dp)
            .clip(RoundedCornerShape(4.dp))
            .background(if (enabled) Blue else Blue.copy(alpha = 0.7f))
            .clickable(enabled = enabled, onClick = onClick),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (plus) {
            Text("+", color = Color.White, fontSize = 18.sp, modifier = Modifier.padding(end = 6.dp))
        } else {
            DownloadGlyph()
            Spacer(Modifier.width(6.dp))
        }
        Text(text, color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, maxLines = 1)
    }
}

@Composable
private fun DownloadGlyph() {
    Canvas(Modifier.size(14.dp)) {
        drawLine(Color.White, Offset(size.width / 2f, size.height * 0.08f), Offset(size.width / 2f, size.height * 0.62f), strokeWidth = 2.2f, cap = StrokeCap.Round)
        val path = Path().apply {
            moveTo(size.width * 0.22f, size.height * 0.46f)
            lineTo(size.width / 2f, size.height * 0.74f)
            lineTo(size.width * 0.78f, size.height * 0.46f)
        }
        drawPath(path, Color.White, style = Stroke(width = 2.2f, cap = StrokeCap.Round))
        drawLine(Color.White, Offset(size.width * 0.16f, size.height * 0.9f), Offset(size.width * 0.84f, size.height * 0.9f), strokeWidth = 2.2f, cap = StrokeCap.Round)
    }
}

private fun download(context: Context, title: String, quality: Quality) {
    val cleaned = title.replace(Regex("""[\\/:*?"<>|]"""), " ").replace(Regex("""\s+"""), " ").trim().take(50).ifBlank { "video" }
    val name = "$cleaned ${quality.width}x${quality.height}.mp4"
    val request = DownloadManager.Request(Uri.parse(quality.url))
        .setTitle(name)
        .setMimeType("video/mp4")
        .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
        .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name)
        .addRequestHeader("User-Agent", "Mozilla/5.0")
        .addRequestHeader("Referer", "https://x.com/")
    val manager = context.getSystemService(DownloadManager::class.java)
    manager.enqueue(request)
}
