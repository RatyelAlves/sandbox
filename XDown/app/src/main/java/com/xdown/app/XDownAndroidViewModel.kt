package com.xdown.app

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.xdown.app.data.MediaDownloader
import com.xdown.app.data.MediaRepository

class XDownAndroidViewModel(
    repository: MediaRepository,
    downloader: MediaDownloader,
) : ViewModel() {
    val session = XDownViewModel(viewModelScope, repository, downloader)

    companion object {
        fun factory(
            repository: MediaRepository,
            downloader: MediaDownloader,
        ): ViewModelProvider.Factory {
            return object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return XDownAndroidViewModel(repository, downloader) as T
                }
            }
        }
    }
}
