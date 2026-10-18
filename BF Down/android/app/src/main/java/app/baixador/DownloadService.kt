package app.baixador

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

class DownloadService : Service() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private var job: Job? = null
    private var resultPosted = false
    private val client by lazy {
        OkHttpClient.Builder()
            .connectTimeout(20, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .followRedirects(true)
            .build()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_CANCEL) {
            job?.cancel()
            return START_NOT_STICKY
        }
        if (job?.isActive == true) return START_NOT_STICKY
        val media = readMedia(intent) ?: run {
            stopSelf()
            return START_NOT_STICKY
        }
        ensureChannel()
        resultPosted = false
        val manager = getSystemService(NotificationManager::class.java)
        manager.cancel(RESULT_ID)
        val starting = notification(media.title, "Preparando o arquivo…", 0, ongoing = true)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, starting, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        } else {
            startForeground(NOTIFICATION_ID, starting)
        }
        DownloadHub.publish(DownloadState.Running(0, "Preparando o arquivo…"))
        job = scope.launch(Dispatchers.IO) {
            try {
                val saved = Downloader(this@DownloadService, client).save(media) { fraction, label ->
                    val percent = (fraction * 100).toInt().coerceIn(0, 100)
                    DownloadHub.publish(DownloadState.Running(percent, label))
                    notify(notification(media.title, label, percent, ongoing = true))
                }
                DownloadHub.publish(DownloadState.Done(saved))
                finishNotice(media.title, "Salvo em Downloads/Baixador/$saved", done = true)
            } catch (_: CancellationException) {
                DownloadHub.publish(DownloadState.Cancelled)
                finishNotice(media.title, "Download cancelado.")
            } catch (error: Exception) {
                val message = error.message ?: "Não deu certo."
                DownloadHub.publish(DownloadState.Failed(message))
                finishNotice(media.title, message)
            } finally {
                job = null
                if (!resultPosted) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                        stopForeground(STOP_FOREGROUND_REMOVE)
                    } else {
                        @Suppress("DEPRECATION")
                        stopForeground(true)
                    }
                }
                stopSelf()
            }
        }
        return START_NOT_STICKY
    }

    private fun notify(notification: Notification) {
        getSystemService(NotificationManager::class.java).notify(NOTIFICATION_ID, notification)
    }

    private fun ensureChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = getSystemService(NotificationManager::class.java)
        val channel = NotificationChannel(CHANNEL_ID, "Downloads", NotificationManager.IMPORTANCE_LOW)
        channel.setShowBadge(false)
        manager.createNotificationChannel(channel)
    }

    private fun finishNotice(title: String, text: String, done: Boolean = false) {
        resultPosted = true
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(true)
        }
        getSystemService(NotificationManager::class.java).notify(
            RESULT_ID,
            notification(title, text, 0, ongoing = false, done = done),
        )
    }

    private fun notification(title: String, text: String, percent: Int, ongoing: Boolean, done: Boolean = false): Notification {
        val open = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val cancel = PendingIntent.getService(
            this,
            1,
            Intent(this, DownloadService::class.java).setAction(ACTION_CANCEL),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val icon = when {
            done -> R.drawable.ic_stat_check
            ongoing -> android.R.drawable.stat_sys_download
            else -> R.drawable.ic_stat_download
        }
        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(icon)
            .setContentTitle(title.ifBlank { "BF Down" })
            .setContentText(text)
            .setContentIntent(open)
            .setOnlyAlertOnce(true)
            .setOngoing(ongoing)
            .setColor(0xFF3DDC84.toInt())
        if (ongoing) {
            builder.setProgress(100, percent, false)
            builder.addAction(0, "Cancelar", cancel)
        } else {
            builder.setProgress(0, 0, false)
            builder.setAutoCancel(true)
            builder.setTimeoutAfter(4_000)
        }
        return builder.build()
    }

    private fun readMedia(intent: Intent?): MediaInfo? {
        val page = intent?.getStringExtra(EXTRA_PAGE).orEmpty()
        val stream = intent?.getStringExtra(EXTRA_STREAM).orEmpty()
        if (!page.startsWith("http") || stream.isBlank()) return null
        return MediaInfo(
            pageUrl = page,
            streamUrl = stream,
            title = intent?.getStringExtra(EXTRA_TITLE).orEmpty().ifBlank { "Vídeo" },
            quality = intent?.getStringExtra(EXTRA_QUALITY).orEmpty(),
            durationSeconds = 0.0,
            imageBytes = null,
            userAgent = intent?.getStringExtra(EXTRA_AGENT).orEmpty(),
            cookie = intent?.getStringExtra(EXTRA_COOKIE).orEmpty(),
        )
    }

    companion object {
        const val ACTION_CANCEL = "app.baixador.DOWNLOAD_CANCEL"
        private const val CHANNEL_ID = "downloads"
        private const val NOTIFICATION_ID = 42
        private const val RESULT_ID = 43
        private const val EXTRA_PAGE = "page"
        private const val EXTRA_STREAM = "stream"
        private const val EXTRA_TITLE = "title"
        private const val EXTRA_QUALITY = "quality"
        private const val EXTRA_AGENT = "agent"
        private const val EXTRA_COOKIE = "cookie"

        fun start(context: Context, media: MediaInfo) {
            val intent = Intent(context, DownloadService::class.java)
                .putExtra(EXTRA_PAGE, media.pageUrl)
                .putExtra(EXTRA_STREAM, media.streamUrl)
                .putExtra(EXTRA_TITLE, media.title)
                .putExtra(EXTRA_QUALITY, media.quality)
                .putExtra(EXTRA_AGENT, media.userAgent)
                .putExtra(EXTRA_COOKIE, media.cookie)
            context.startForegroundService(intent)
        }
    }
}
