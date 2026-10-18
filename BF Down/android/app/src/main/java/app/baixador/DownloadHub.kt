package app.baixador

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

sealed class DownloadState {
    data object Idle : DownloadState()
    data class Running(val percent: Int, val label: String) : DownloadState()
    data class Done(val name: String) : DownloadState()
    data class Failed(val message: String) : DownloadState()
    data object Cancelled : DownloadState()
}

object DownloadHub {
    private val updates = MutableStateFlow<DownloadState>(DownloadState.Idle)
    val state: StateFlow<DownloadState> = updates

    fun publish(next: DownloadState) {
        updates.value = next
    }
}
