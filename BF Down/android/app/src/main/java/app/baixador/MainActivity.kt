package app.baixador

import android.Manifest
import android.content.ClipboardManager
import android.content.Intent
import android.content.pm.PackageManager
import android.content.res.ColorStateList
import android.graphics.BitmapFactory
import android.graphics.ImageDecoder
import android.os.Build
import android.os.Bundle
import android.view.View
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import com.google.android.material.chip.Chip
import androidx.appcompat.app.AppCompatActivity
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.core.widget.doAfterTextChanged
import androidx.lifecycle.lifecycleScope
import app.baixador.databinding.ActivityMainBinding
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import java.nio.ByteBuffer
import java.util.concurrent.TimeUnit

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private val client = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(45, TimeUnit.SECONDS)
        .followRedirects(true)
        .build()
    private lateinit var finder: PageFinder
    private var work: Job? = null
    private var media: MediaInfo? = null
    private var downloading = false
    private val notificationPermission = registerForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { granted ->
        if (granted) launchDownload()
        else setStatus("Permite as notificações para baixar em segundo plano.")
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        finder = PageFinder(binding.webView, client)
        finder.prepare(DESKTOP_AGENT)

        binding.searchButton.setOnClickListener { startSearch() }
        binding.pasteButton.setOnClickListener { pasteLink() }
        binding.downloadButton.setOnClickListener { startDownload() }
        binding.cancelButton.setOnClickListener { cancelWork() }
        binding.urlInput.doAfterTextChanged {
            val current = binding.urlInput.text?.toString()?.trim().orEmpty()
            if (media != null && media?.pageUrl != current && work?.isActive != true && !downloading) {
                clearPreview()
            }
        }
        lifecycleScope.launch {
            DownloadHub.state.collect { state -> applyDownload(state) }
        }
    }

    private fun pasteLink() {
        val clipboard = getSystemService(CLIPBOARD_SERVICE) as ClipboardManager
        val text = clipboard.primaryClip?.takeIf { it.itemCount > 0 }
            ?.getItemAt(0)?.coerceToText(this)?.toString()?.trim().orEmpty()
        if (text.isEmpty()) {
            setStatus("Não há nada para colar.")
            return
        }
        binding.urlInput.setText(text)
        binding.urlInput.setSelection(binding.urlInput.text?.length ?: 0)
    }

    private fun startSearch() {
        if (work?.isActive == true) return
        val url = binding.urlInput.text?.toString()?.trim().orEmpty()
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            setStatus("Cole o link completo da página, começando com https://", busy = false)
            return
        }
        clearPreview()
        setBusy(true)
        setIndeterminate(true)
        setStatus("Buscando o vídeo em segundo plano…")
        work = lifecycleScope.launch {
            try {
                val found = finder.find(
                    url = url,
                    onStatus = { message -> runOnUiThread { setStatus(message) } },
                    onChallenge = { show -> runOnUiThread { showChallenge(show) } },
                )
                showPreview(found)
                setStatus(
                    if (found.options.size > 1) "Escolha a qualidade e toque em Baixar."
                    else "Prévia pronta. Toque em Baixar para salvar."
                )
            } catch (_: CancellationException) {
                setStatus("Busca cancelada.")
            } catch (error: Exception) {
                setStatus(error.message ?: "Não deu certo.")
            } finally {
                showChallenge(false)
                setIndeterminate(false)
                setBusy(false)
            }
        }
    }

    private fun startDownload() {
        if (work?.isActive == true || downloading) return
        val current = media
        val url = binding.urlInput.text?.toString()?.trim().orEmpty()
        if (current == null || current.pageUrl != url) {
            setStatus("Busca o vídeo antes de baixar.")
            return
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            notificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
            return
        }
        launchDownload()
    }

    private fun launchDownload() {
        val current = media ?: return
        downloading = true
        setIndeterminate(false)
        binding.progress.progress = 0
        setBusy(false)
        setStatus("Preparando o arquivo…")
        DownloadService.start(this, current)
    }

    private fun applyDownload(state: DownloadState) {
        when (state) {
            DownloadState.Idle -> Unit
            is DownloadState.Running -> {
                downloading = true
                setIndeterminate(false)
                binding.progress.progress = state.percent
                setStatus(state.label)
                setBusy(work?.isActive == true)
            }
            is DownloadState.Done -> {
                downloading = false
                binding.progress.progress = 100
                setIndeterminate(false)
                setStatus("Salvo em Downloads/Baixador/${state.name}")
                setBusy(false)
            }
            is DownloadState.Failed -> {
                downloading = false
                setIndeterminate(false)
                setStatus(state.message)
                setBusy(false)
            }
            DownloadState.Cancelled -> {
                downloading = false
                setIndeterminate(false)
                setStatus("Download cancelado.")
                setBusy(false)
            }
        }
    }

    private fun cancelWork() {
        if (downloading) {
            startService(Intent(this, DownloadService::class.java).setAction(DownloadService.ACTION_CANCEL))
            setStatus("Cancelando…")
            return
        }
        work?.cancel()
        finder.stop()
        setStatus("Cancelando…")
    }

    private fun showPreview(info: MediaInfo) {
        media = info
        binding.previewTitle.text = info.title
        renderMeta(info)
        val bytes = info.imageBytes
        val bitmap = if (bytes != null && bytes.isNotEmpty()) decodeThumb(bytes) else null
        if (bitmap != null) {
            binding.thumb.setImageBitmap(bitmap)
            applyThumbRatio(bitmap.width, bitmap.height)
        } else {
            binding.thumb.setImageDrawable(null)
            applyThumbRatio(16, 9)
        }
        showQualities(info)
        binding.downloadButton.isEnabled = true
    }

    private fun applyThumbRatio(width: Int, height: Int) {
        if (width <= 0 || height <= 0) return
        val params = binding.thumbCard.layoutParams as ConstraintLayout.LayoutParams
        params.dimensionRatio = "$width:$height"
        binding.thumbCard.layoutParams = params
    }

    private fun decodeThumb(bytes: ByteArray): android.graphics.Bitmap? {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)
        if (bounds.outWidth > 0 && bounds.outHeight > 0) {
            var sample = 1
            while (bounds.outWidth / sample > 1080 || bounds.outHeight / sample > 1080) sample *= 2
            val options = BitmapFactory.Options().apply { inSampleSize = sample }
            BitmapFactory.decodeByteArray(bytes, 0, bytes.size, options)?.let { return it }
        }
        return runCatching {
            val source = ImageDecoder.createSource(ByteBuffer.wrap(bytes))
            ImageDecoder.decodeBitmap(source) { decoder, info, _ ->
                val width = info.size.width
                val height = info.size.height
                var sample = 1
                while (width / sample > 1080 || height / sample > 1080) sample *= 2
                decoder.setTargetSampleSize(sample)
            }
        }.getOrNull()
    }

    private fun showQualities(info: MediaInfo) {
        val group = binding.qualityGroup
        group.removeAllViews()
        if (info.options.isEmpty()) {
            binding.qualityScroll.visibility = View.GONE
            return
        }
        val green = getColor(R.color.green)
        val card = getColor(R.color.card)
        val ink = getColor(R.color.ink)
        val onGreen = getColor(R.color.canvas)
        info.options.forEach { option ->
            val chip = Chip(this).apply {
                text = option.label
                isCheckable = true
                chipMinHeight = dp(36).toFloat()
                textSize = 14f
                chipBackgroundColor = ColorStateList(
                    arrayOf(intArrayOf(android.R.attr.state_checked), intArrayOf()),
                    intArrayOf(green, card),
                )
                setTextColor(
                    ColorStateList(
                        arrayOf(intArrayOf(android.R.attr.state_checked), intArrayOf()),
                        intArrayOf(onGreen, ink),
                    )
                )
                chipStrokeWidth = dp(1).toFloat()
                chipStrokeColor = ColorStateList.valueOf(getColor(R.color.line))
                isChecked = option.url == info.streamUrl
            }
            chip.setOnCheckedChangeListener { _, checked ->
                if (checked) selectQuality(option)
            }
            group.addView(chip)
        }
        binding.qualityScroll.visibility = View.VISIBLE
    }

    private fun selectQuality(option: QualityOption) {
        val current = media ?: return
        if (current.streamUrl == option.url) return
        val updated = current.copy(streamUrl = option.url, quality = option.label)
        media = updated
        renderMeta(updated)
    }

    private fun renderMeta(info: MediaInfo) {
        val bits = mutableListOf<String>()
        if (info.durationSeconds > 1) bits += clock(info.durationSeconds)
        if (info.quality.isNotBlank()) bits += info.quality
        binding.previewMeta.text = if (bits.isEmpty()) "Pronto para baixar" else bits.joinToString("   ·   ")
    }

    private fun clearPreview() {
        media = null
        binding.previewTitle.text = "Nenhum vídeo buscado ainda."
        binding.previewMeta.text = "A capa, o tempo e a qualidade aparecem depois da busca."
        binding.thumb.setImageDrawable(null)
        applyThumbRatio(16, 9)
        binding.qualityGroup.removeAllViews()
        binding.qualityScroll.visibility = View.GONE
        binding.downloadButton.isEnabled = false
        binding.progress.progress = 0
    }

    private fun showChallenge(show: Boolean) {
        binding.webView.visibility = if (show) View.VISIBLE else View.INVISIBLE
        binding.challengeLabel.visibility = if (show) View.VISIBLE else View.GONE
        binding.contentScroll.visibility = if (show) View.GONE else View.VISIBLE
        if (show) {
            binding.webView.bringToFront()
            binding.challengeLabel.bringToFront()
        } else {
            binding.contentScroll.bringToFront()
        }
    }

    private fun setBusy(busy: Boolean) {
        val locked = busy || downloading
        binding.searchButton.isEnabled = !locked
        binding.pasteButton.isEnabled = !locked
        binding.urlInput.isEnabled = !locked
        binding.cancelButton.isEnabled = locked
        binding.downloadButton.isEnabled = !locked && media != null &&
            media?.pageUrl == binding.urlInput.text?.toString()?.trim()
        for (index in 0 until binding.qualityGroup.childCount) {
            binding.qualityGroup.getChildAt(index).isEnabled = !locked
        }
    }

    private fun setStatus(message: String, busy: Boolean? = null) {
        binding.status.text = message
        if (busy != null) setBusy(busy)
    }

    private fun setIndeterminate(indeterminate: Boolean) {
        binding.progress.isIndeterminate = indeterminate
        if (!indeterminate && binding.progress.progress == 0) {
            binding.progress.progress = 0
        }
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    private fun clock(seconds: Double): String {
        val total = seconds.toInt().coerceAtLeast(0)
        val hours = total / 3600
        val minutes = (total % 3600) / 60
        val secs = total % 60
        return if (hours > 0) "%d:%02d:%02d".format(hours, minutes, secs) else "%02d:%02d".format(minutes, secs)
    }

    override fun onDestroy() {
        work?.cancel()
        finder.stop()
        binding.webView.destroy()
        super.onDestroy()
    }

    companion object {
        private const val DESKTOP_AGENT =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    }
}
