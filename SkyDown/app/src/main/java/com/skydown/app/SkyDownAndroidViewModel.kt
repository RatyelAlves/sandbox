package com.skydown.app

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.skydown.app.data.MediaDownloader
import com.skydown.app.data.MediaRepository

class SkyDownAndroidViewModel(
    repository: MediaRepository,
    downloader: MediaDownloader,
) : ViewModel() {
    val session = SkyDownViewModel(viewModelScope, repository, downloader)

    companion object {
        fun factory(
            repository: MediaRepository,
            downloader: MediaDownloader,
        ): ViewModelProvider.Factory {
            return object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return SkyDownAndroidViewModel(repository, downloader) as T
                }
            }
        }
    }
}
