package app.baixador

data class QualityOption(
    val url: String,
    val label: String,
)

data class MediaInfo(
    val pageUrl: String,
    val streamUrl: String,
    val title: String,
    val quality: String,
    val durationSeconds: Double,
    val imageBytes: ByteArray?,
    val userAgent: String,
    val cookie: String,
    val options: List<QualityOption> = emptyList(),
)
