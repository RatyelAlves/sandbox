package com.xdown.app

import com.xdown.app.data.MediaDownloader
import com.xdown.app.data.MediaItem
import com.xdown.app.data.MediaKind
import com.xdown.app.data.MediaRepository
import com.xdown.app.data.Profile
import com.xdown.app.data.ProfileUrlParser
import com.xdown.app.data.XDownException
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Semaphore
import kotlinx.coroutines.sync.withPermit
import java.util.concurrent.atomic.AtomicInteger

data class DownloadProgress(
    val current: Int,
    val total: Int,
    val fileName: String,
)

data class UiState(
    val query: String = "",
    val isLoading: Boolean = false,
    val isLoadingMore: Boolean = false,
    val isDownloading: Boolean = false,
    val profile: Profile? = null,
    val items: List<MediaItem> = emptyList(),
    val selectedIds: Set<String> = emptySet(),
    val filter: MediaFilter = MediaFilter.ALL,
    val nextCursor: String? = null,
    val error: String? = null,
    val notice: String? = null,
    val downloadProgress: DownloadProgress? = null,
    val previewItemId: String? = null,
) {
    val visibleItems: List<MediaItem>
        get() = items.filter { item ->
            when (filter) {
                MediaFilter.ALL -> true
                MediaFilter.PHOTOS -> item.kind == MediaKind.PHOTO
                MediaFilter.VIDEOS -> item.kind == MediaKind.VIDEO || item.kind == MediaKind.GIF
            }
        }

    val canLoadMore: Boolean get() = nextCursor != null && !isLoading && !isLoadingMore
}

enum class MediaFilter { ALL, PHOTOS, VIDEOS }

class XDownViewModel(
    private val scope: CoroutineScope,
    private val repository: MediaRepository,
    private val downloader: MediaDownloader,
) {
    private val _state = MutableStateFlow(UiState())
    val state: StateFlow<UiState> = _state

    private var searchJob: Job? = null
    private var currentHandle: String? = null

    fun onQueryChange(value: String) {
        _state.update { it.copy(query = value, error = null) }
    }

    fun onFilterChange(filter: MediaFilter) {
        _state.update { it.copy(filter = filter) }
    }

    fun consumeNotice() {
        _state.update { it.copy(notice = null) }
    }

    fun toggleSelected(id: String) {
        _state.update { current ->
            val next = current.selectedIds.toMutableSet()
            if (!next.add(id)) next.remove(id)
            current.copy(selectedIds = next)
        }
    }

    fun selectVisible() {
        _state.update { current ->
            current.copy(selectedIds = current.visibleItems.map { it.id }.toSet())
        }
    }

    fun clearSelection() {
        _state.update { it.copy(selectedIds = emptySet()) }
    }

    fun openPreview(id: String) {
        _state.update { it.copy(previewItemId = id) }
    }

    fun closePreview() {
        _state.update { it.copy(previewItemId = null) }
    }

    fun downloadOne(id: String) {
        val item = _state.value.items.find { it.id == id } ?: return
        download(listOf(item), clearSelection = false)
    }

    fun search() {
        val handle = ProfileUrlParser.extractHandle(_state.value.query)
            ?: run {
                _state.update {
                    it.copy(error = "Cole um link de perfil do X, como https://x.com/usuario")
                }
                return
            }
        searchJob?.cancel()
        searchJob = scope.launch {
            currentHandle = handle
            _state.update {
                it.copy(
                    isLoading = true,
                    error = null,
                    notice = null,
                    profile = null,
                    items = emptyList(),
                    selectedIds = emptySet(),
                    nextCursor = null,
                    previewItemId = null,
                )
            }
            try {
                val profile = repository.loadProfile(handle)
                var page = repository.loadMediaPage(handle, cursor = null)
                var skips = 0
                while (page.items.isEmpty() && page.nextCursor != null && skips < 3) {
                    page = repository.loadMediaPage(handle, page.nextCursor)
                    skips += 1
                }
                _state.update {
                    it.copy(
                        isLoading = false,
                        profile = profile,
                        items = page.items.distinctBy { item -> item.id },
                        nextCursor = page.nextCursor,
                        error = if (page.items.isEmpty()) {
                            "Este perfil não tem mídia pública no momento."
                        } else {
                            null
                        },
                    )
                }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (error: Exception) {
                _state.update {
                    it.copy(
                        isLoading = false,
                        error = (error as? XDownException)?.message
                            ?: "Não foi possível buscar este perfil.",
                    )
                }
            }
        }
    }

    fun loadMore() {
        val handle = currentHandle ?: return
        val cursor = _state.value.nextCursor ?: return
        if (_state.value.isLoadingMore || _state.value.isLoading) return
        scope.launch {
            _state.update { it.copy(isLoadingMore = true) }
            try {
                val page = repository.loadMediaPage(handle, cursor)
                _state.update { current ->
                    current.copy(
                        isLoadingMore = false,
                        items = (current.items + page.items).distinctBy { it.id },
                        nextCursor = page.nextCursor,
                    )
                }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (error: Exception) {
                _state.update {
                    it.copy(
                        isLoadingMore = false,
                        notice = (error as? XDownException)?.message
                            ?: "Não foi possível carregar mais mídia.",
                    )
                }
            }
        }
    }

    fun downloadSelected() {
        val selected = _state.value.items.filter { it.id in _state.value.selectedIds }
        download(selected)
    }

    fun downloadVisible() {
        download(_state.value.visibleItems)
    }

    private fun download(targets: List<MediaItem>, clearSelection: Boolean = true) {
        if (targets.isEmpty() || _state.value.isDownloading) return
        scope.launch {
            _state.update {
                it.copy(
                    isDownloading = true,
                    downloadProgress = DownloadProgress(0, targets.size, targets.first().fileName),
                    error = null,
                )
            }
            val semaphore = Semaphore(3)
            val completed = AtomicInteger(0)
            val failures = AtomicInteger(0)
            try {
                kotlinx.coroutines.coroutineScope {
                    targets.forEach { item ->
                        launch {
                            semaphore.withPermit {
                                runCatching { downloader.download(item) }
                                    .onFailure { failures.incrementAndGet() }
                                val current = completed.incrementAndGet()
                                _state.update { ui ->
                                    ui.copy(
                                        downloadProgress = DownloadProgress(
                                            current = current,
                                            total = targets.size,
                                            fileName = item.fileName,
                                        ),
                                    )
                                }
                            }
                        }
                    }
                }
                val failed = failures.get()
                val message = when {
                    failed == 0 ->
                        "Download concluído: ${targets.size} arquivo(s) em ${downloader.destinationHint}."
                    failed == targets.size -> "Nenhum arquivo pôde ser baixado."
                    else -> "Baixados ${targets.size - failed} de ${targets.size}. Alguns falharam."
                }
                _state.update {
                    it.copy(
                        isDownloading = false,
                        downloadProgress = null,
                        selectedIds = if (clearSelection) emptySet() else it.selectedIds,
                        notice = message,
                    )
                }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (error: Exception) {
                _state.update {
                    it.copy(
                        isDownloading = false,
                        downloadProgress = null,
                        notice = (error as? XDownException)?.message ?: "Falha no download.",
                    )
                }
            }
        }
    }
}
