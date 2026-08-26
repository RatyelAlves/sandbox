package com.xdown.app.ui.home

import android.content.ClipboardManager
import android.content.Context
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.grid.rememberLazyGridState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.ContentPaste
import androidx.compose.material.icons.outlined.Download
import androidx.compose.material.icons.outlined.Image
import androidx.compose.material.icons.outlined.Link
import androidx.compose.material.icons.outlined.PlayArrow
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Videocam
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.xdown.app.MediaFilter
import com.xdown.app.XDownViewModel
import com.xdown.app.data.MediaItem
import com.xdown.app.data.MediaKind
import com.xdown.app.data.NetworkModule
import com.xdown.app.data.Profile
import com.xdown.app.ui.theme.Hairline
import com.xdown.app.ui.theme.Ink
import com.xdown.app.ui.theme.InkCard
import com.xdown.app.ui.theme.InkDeep
import com.xdown.app.ui.theme.InkElevated
import com.xdown.app.ui.theme.Mute
import com.xdown.app.ui.theme.Snow
import com.xdown.app.ui.theme.Success
import com.xdown.app.ui.theme.VideoBadge
import com.xdown.app.ui.theme.XBlue
import com.xdown.app.ui.theme.XCyan
import kotlinx.coroutines.flow.distinctUntilChanged

private val ScreenGradient = Brush.verticalGradient(
    colors = listOf(InkDeep, Ink, Color(0xFF05060A)),
)
private val AccentGradient = Brush.horizontalGradient(
    colors = listOf(XBlue, XCyan),
)
private val TileShape = RoundedCornerShape(16.dp)

@Composable
fun HomeScreen(viewModel: XDownViewModel) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    val context = LocalContext.current
    val focus = LocalFocusManager.current
    val gridState = rememberLazyGridState()

    LaunchedEffect(state.notice) {
        val message = state.notice ?: return@LaunchedEffect
        snackbar.showSnackbar(message)
        viewModel.consumeNotice()
    }

    LaunchedEffect(gridState, state.canLoadMore) {
        snapshotFlow {
            val last = gridState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
            val total = gridState.layoutInfo.totalItemsCount
            last >= total - 6
        }.distinctUntilChanged().collect { nearEnd ->
            if (nearEnd && state.canLoadMore) viewModel.loadMore()
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = Ink,
        snackbarHost = {},
        bottomBar = {
            AnimatedVisibility(
                visible = state.visibleItems.isNotEmpty() && state.previewItemId == null,
                enter = fadeIn(),
                exit = fadeOut(),
            ) {
                DownloadBar(
                    selectedCount = state.selectedIds.size,
                    visibleCount = state.visibleItems.size,
                    isDownloading = state.isDownloading,
                    progress = state.downloadProgress?.let { it.current to it.total },
                    onDownloadSelected = viewModel::downloadSelected,
                    onDownloadVisible = viewModel::downloadVisible,
                    onSelectVisible = viewModel::selectVisible,
                    onClearSelection = viewModel::clearSelection,
                )
            }
        },
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(ScreenGradient),
        ) {
            GlowBlob(modifier = Modifier.offset(x = 80.dp, y = (-60).dp).size(280.dp))
            LazyVerticalGrid(
                state = gridState,
                columns = GridCells.Fixed(3),
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentPadding = PaddingValues(start = 14.dp, end = 14.dp, bottom = 20.dp),
                horizontalArrangement = Arrangement.spacedBy(7.dp),
                verticalArrangement = Arrangement.spacedBy(7.dp),
            ) {
                item(span = { GridItemSpan(3) }) {
                    Header(
                        query = state.query,
                        isLoading = state.isLoading,
                        error = state.error,
                        profile = state.profile,
                        itemCount = state.visibleItems.size,
                        filter = state.filter,
                        showEmpty = state.profile == null && !state.isLoading,
                        onQueryChange = viewModel::onQueryChange,
                        onPaste = { readClipboard(context)?.let(viewModel::onQueryChange) },
                        onSearch = {
                            focus.clearFocus()
                            viewModel.search()
                        },
                        onFilterChange = viewModel::onFilterChange,
                    )
                }

                if (state.isLoading) {
                    items(9) {
                        ShimmerTile()
                    }
                }

                items(state.visibleItems, key = { it.id }) { item ->
                    MediaTile(
                        item = item,
                        selected = item.id in state.selectedIds,
                        onOpen = { viewModel.openPreview(item.id) },
                        onSelect = { viewModel.toggleSelected(item.id) },
                    )
                }

                if (state.isLoadingMore) {
                    item(span = { GridItemSpan(3) }) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(18.dp),
                            horizontalArrangement = Arrangement.Center,
                        ) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(22.dp),
                                color = XCyan,
                                strokeWidth = 2.dp,
                            )
                        }
                    }
                }
            }
        }
    }

        val previewId = state.previewItemId
        if (previewId != null && state.visibleItems.any { it.id == previewId }) {
            MediaPreview(
                items = state.visibleItems,
                startId = previewId,
                selectedIds = state.selectedIds,
                isDownloading = state.isDownloading,
                progress = state.downloadProgress?.let { it.current to it.total },
                onClose = viewModel::closePreview,
                onDownload = viewModel::downloadOne,
                onToggleSelect = viewModel::toggleSelected,
                onNearEnd = viewModel::loadMore,
            )
        }
        SnackbarHost(
            hostState = snackbar,
            modifier = Modifier.align(Alignment.BottomCenter),
        ) { data ->
            Snackbar(
                snackbarData = data,
                containerColor = InkCard,
                contentColor = Snow,
                shape = RoundedCornerShape(18.dp),
            )
        }
    }
}

@Composable
private fun GlowBlob(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier.background(
            brush = Brush.radialGradient(
                colors = listOf(XBlue.copy(alpha = 0.32f), Color.Transparent),
            ),
            shape = CircleShape,
        ),
    )
}

@Composable
private fun Header(
    query: String,
    isLoading: Boolean,
    error: String?,
    profile: Profile?,
    itemCount: Int,
    filter: MediaFilter,
    showEmpty: Boolean,
    onQueryChange: (String) -> Unit,
    onPaste: () -> Unit,
    onSearch: () -> Unit,
    onFilterChange: (MediaFilter) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .statusBarsPadding()
            .padding(top = 10.dp, bottom = 8.dp),
    ) {
        Text(
            text = buildAnnotatedString {
                withStyle(SpanStyle(color = XBlue, fontWeight = FontWeight.Black)) { append("X") }
                withStyle(SpanStyle(color = Snow, fontWeight = FontWeight.Black)) { append("DOWN") }
            },
            style = MaterialTheme.typography.headlineMedium,
        )
        Text(
            "Mídia pública, direto do perfil",
            color = Mute,
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.padding(top = 2.dp, bottom = 18.dp),
        )

        SearchCard(
            query = query,
            isLoading = isLoading,
            onQueryChange = onQueryChange,
            onPaste = onPaste,
            onSearch = onSearch,
        )

        if (!error.isNullOrBlank() && profile == null) {
            ErrorBanner(error)
        }

        if (profile != null) {
            Spacer(Modifier.height(18.dp))
            ProfileHero(profile, itemCount)
            Spacer(Modifier.height(14.dp))
            FilterBar(filter, onFilterChange)
            Text(
                "Toque para ver em tela cheia · Segure ou use o ✓ para selecionar",
                color = Mute,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(top = 10.dp, start = 4.dp),
            )
            if (!error.isNullOrBlank()) {
                Text(
                    error,
                    color = Mute,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(top = 10.dp),
                )
            }
        } else if (showEmpty) {
            Spacer(Modifier.height(22.dp))
            EmptyState()
        }
        Spacer(Modifier.height(6.dp))
    }
}

@Composable
private fun SearchCard(
    query: String,
    isLoading: Boolean,
    onQueryChange: (String) -> Unit,
    onPaste: () -> Unit,
    onSearch: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(28.dp))
            .background(InkCard)
            .border(1.dp, Hairline.copy(alpha = 0.8f), RoundedCornerShape(28.dp))
            .padding(14.dp),
    ) {
        OutlinedTextField(
            value = query,
            onValueChange = onQueryChange,
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("Cole o link do perfil", color = Mute) },
            singleLine = true,
            shape = RoundedCornerShape(18.dp),
            leadingIcon = {
                Icon(Icons.Outlined.Link, contentDescription = null, tint = XCyan)
            },
            trailingIcon = {
                TextButton(onClick = onPaste) {
                    Icon(Icons.Outlined.ContentPaste, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Colar", fontSize = 13.sp)
                }
            },
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
            keyboardActions = KeyboardActions(onSearch = { onSearch() }),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = XBlue,
                unfocusedBorderColor = Color.Transparent,
                focusedContainerColor = InkElevated,
                unfocusedContainerColor = InkElevated,
                cursorColor = XCyan,
            ),
        )
        Spacer(Modifier.height(12.dp))
        Button(
            onClick = onSearch,
            enabled = query.isNotBlank() && !isLoading,
            modifier = Modifier
                .fillMaxWidth()
                .height(54.dp),
            shape = RoundedCornerShape(18.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = Color.Transparent,
                disabledContainerColor = InkElevated,
            ),
            contentPadding = PaddingValues(),
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        if (query.isNotBlank() && !isLoading) AccentGradient else Brush.linearGradient(
                            listOf(InkElevated, InkElevated),
                        ),
                    ),
                contentAlignment = Alignment.Center,
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(18.dp),
                            color = Snow,
                            strokeWidth = 2.dp,
                        )
                    } else {
                        Icon(Icons.Outlined.Search, contentDescription = null)
                    }
                    Spacer(Modifier.width(8.dp))
                    Text("Buscar mídia", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun ErrorBanner(message: String) {
    Text(
        text = message,
        color = Snow,
        style = MaterialTheme.typography.bodyMedium,
        modifier = Modifier
            .padding(top = 12.dp)
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0x33FF5A67))
            .border(1.dp, Color(0x55FF5A67), RoundedCornerShape(16.dp))
            .padding(horizontal = 14.dp, vertical = 12.dp),
    )
}

@Composable
private fun EmptyState() {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        HintCard(Icons.Outlined.Link, "1. Cole o link", "https://x.com/usuario, @usuario ou só o nome")
        HintCard(Icons.Outlined.Image, "2. Veja em tela cheia", "Toque numa foto ou vídeo para ampliar. Deslize para o lado.")
        HintCard(Icons.Outlined.Download, "3. Baixe para o celular", "Os arquivos vão para a galeria, em XDown")
        Text(
            "Use só para conteúdo que você tem permissão de copiar — por exemplo, o seu próprio perfil.",
            color = Mute,
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.padding(top = 8.dp, start = 4.dp, end = 4.dp),
        )
    }
}

@Composable
private fun HintCard(icon: ImageVector, title: String, subtitle: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(InkCard.copy(alpha = 0.9f))
            .border(1.dp, Hairline.copy(alpha = 0.7f), RoundedCornerShape(20.dp))
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .size(42.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(XBlue.copy(alpha = 0.16f)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, contentDescription = null, tint = XCyan)
        }
        Spacer(Modifier.width(12.dp))
        Column {
            Text(title, color = Snow, fontWeight = FontWeight.SemiBold)
            Text(subtitle, color = Mute, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
private fun ProfileHero(profile: Profile, itemCount: Int) {
    val countLabel = profile.mediaCount?.let { "$it na mídia" } ?: "$itemCount arquivos"
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(148.dp)
            .clip(RoundedCornerShape(28.dp))
            .background(InkCard),
    ) {
        AsyncImage(
            model = imageRequest(LocalContext.current, profile.bannerUrl),
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop,
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(Color.Transparent, Color(0xE607080C)),
                    ),
                ),
        )
        Row(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            AsyncImage(
                model = imageRequest(LocalContext.current, profile.avatarUrl),
                contentDescription = profile.name,
                modifier = Modifier
                    .size(62.dp)
                    .border(2.dp, XBlue, CircleShape)
                    .clip(CircleShape)
                    .background(InkElevated),
                contentScale = ContentScale.Crop,
            )
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    profile.name,
                    color = Snow,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text("@${profile.handle}", color = Mute, style = MaterialTheme.typography.bodyMedium)
            }
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(999.dp))
                    .background(AccentGradient)
                    .padding(horizontal = 12.dp, vertical = 6.dp),
            ) {
                Text(countLabel, color = Snow, fontWeight = FontWeight.Bold, fontSize = 12.sp)
            }
        }
    }
}

@Composable
private fun FilterBar(filter: MediaFilter, onFilterChange: (MediaFilter) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(InkCard)
            .padding(4.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        FilterSegment("Tudo", filter == MediaFilter.ALL, Modifier.weight(1f)) {
            onFilterChange(MediaFilter.ALL)
        }
        FilterSegment("Fotos", filter == MediaFilter.PHOTOS, Modifier.weight(1f)) {
            onFilterChange(MediaFilter.PHOTOS)
        }
        FilterSegment("Vídeos", filter == MediaFilter.VIDEOS, Modifier.weight(1f)) {
            onFilterChange(MediaFilter.VIDEOS)
        }
    }
}

@Composable
private fun FilterSegment(label: String, selected: Boolean, modifier: Modifier, onClick: () -> Unit) {
    val background by animateColorAsState(
        if (selected) XBlue else Color.Transparent,
        label = "filterBg",
    )
    val content by animateColorAsState(
        if (selected) Snow else Mute,
        label = "filterFg",
    )
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .background(background)
            .clickable(onClick = onClick)
            .padding(vertical = 10.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(label, color = content, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun ShimmerTile() {
    val pulse = rememberInfiniteTransition(label = "shimmer")
    val alpha by pulse.animateFloat(
        initialValue = 0.12f,
        targetValue = 0.28f,
        animationSpec = infiniteRepeatable(
            animation = tween(900, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "shimmerAlpha",
    )
    Box(
        modifier = Modifier
            .aspectRatio(1f)
            .clip(TileShape)
            .background(Snow.copy(alpha = alpha)),
    )
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun MediaTile(
    item: MediaItem,
    selected: Boolean,
    onOpen: () -> Unit,
    onSelect: () -> Unit,
) {
    val scale by animateFloatAsState(if (selected) 0.94f else 1f, label = "tileScale")
    Box(
        modifier = Modifier
            .aspectRatio(1f)
            .scale(scale)
            .clip(TileShape)
            .combinedClickable(
                onClick = onOpen,
                onLongClick = onSelect,
            ),
    ) {
        AsyncImage(
            model = imageRequest(LocalContext.current, item.previewUrl),
            contentDescription = item.tweetText,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop,
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(Color.Transparent, Color(0x66000000)),
                    ),
                ),
        )
        if (item.kind != MediaKind.PHOTO) {
            Row(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(8.dp)
                    .clip(RoundedCornerShape(999.dp))
                    .background(VideoBadge)
                    .padding(horizontal = 8.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(
                    if (item.kind == MediaKind.GIF) Icons.Outlined.Image else Icons.Outlined.Videocam,
                    contentDescription = null,
                    tint = Snow,
                    modifier = Modifier.size(14.dp),
                )
                Spacer(Modifier.width(4.dp))
                Text(
                    if (item.kind == MediaKind.GIF) "GIF" else "Vídeo",
                    color = Snow,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                )
            }
            Icon(
                Icons.Outlined.PlayArrow,
                contentDescription = "Vídeo",
                tint = Snow.copy(alpha = 0.9f),
                modifier = Modifier
                    .align(Alignment.Center)
                    .size(34.dp),
            )
        }
        if (selected) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .border(2.dp, XCyan, TileShape)
                    .background(XBlue.copy(alpha = 0.18f)),
            )
        }
        Box(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(6.dp)
                .size(28.dp)
                .clip(CircleShape)
                .background(Color(0x99000000))
                .clickable(onClick = onSelect),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = if (selected) Icons.Filled.CheckCircle else Icons.Outlined.CheckCircle,
                contentDescription = if (selected) "Remover da seleção" else "Selecionar",
                tint = if (selected) Success else Snow,
                modifier = Modifier.size(18.dp),
            )
        }
    }
}

@Composable
private fun DownloadBar(
    selectedCount: Int,
    visibleCount: Int,
    isDownloading: Boolean,
    progress: Pair<Int, Int>?,
    onDownloadSelected: () -> Unit,
    onDownloadVisible: () -> Unit,
    onSelectVisible: () -> Unit,
    onClearSelection: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                Brush.verticalGradient(
                    colors = listOf(Color.Transparent, Ink),
                ),
            )
            .background(InkElevated.copy(alpha = 0.96f))
            .navigationBarsPadding()
            .padding(horizontal = 16.dp, vertical = 12.dp),
    ) {
        Box(
            modifier = Modifier
                .padding(bottom = 12.dp)
                .fillMaxWidth()
                .height(2.dp)
                .clip(CircleShape)
                .background(AccentGradient),
        )
        if (isDownloading && progress != null) {
            Text(
                "Baixando ${progress.first} de ${progress.second}",
                style = MaterialTheme.typography.labelLarge,
            )
            Spacer(Modifier.height(10.dp))
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
            Row(verticalAlignment = Alignment.CenterVertically) {
                TextButton(onClick = onSelectVisible) { Text("Selecionar tudo") }
                if (selectedCount > 0) {
                    TextButton(onClick = onClearSelection) { Text("Limpar") }
                }
                Spacer(Modifier.weight(1f))
                Text(
                    if (selectedCount > 0) "$selectedCount selecionados" else "$visibleCount visíveis",
                    color = Mute,
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
            Spacer(Modifier.height(6.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Button(
                    onClick = onDownloadSelected,
                    enabled = selectedCount > 0,
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.Transparent,
                        disabledContainerColor = InkCard,
                    ),
                    contentPadding = PaddingValues(),
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                if (selectedCount > 0) AccentGradient else Brush.linearGradient(
                                    listOf(InkCard, InkCard),
                                ),
                            ),
                        contentAlignment = Alignment.Center,
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.Download, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Selecionados", fontWeight = FontWeight.Bold)
                        }
                    }
                }
                Button(
                    onClick = onDownloadVisible,
                    enabled = visibleCount > 0,
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = InkCard),
                ) {
                    Text("Baixar visíveis")
                }
            }
        }
    }
}

@Composable
private fun imageRequest(context: Context, url: String?): ImageRequest {
    return ImageRequest.Builder(context)
        .data(url)
        .crossfade(true)
        .addHeader("User-Agent", NetworkModule.USER_AGENT)
        .build()
}

private fun readClipboard(context: Context): String? {
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    val item = clipboard.primaryClip?.getItemAt(0) ?: return null
    return item.coerceToText(context)?.toString()?.trim()?.takeIf { it.isNotBlank() }
}
