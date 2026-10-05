package com.skydown.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val Scheme = lightColorScheme(
    primary = SkyBlue,
    onPrimary = Snow,
    secondary = SkyCyan,
    background = Ink,
    surface = InkCard,
    surfaceVariant = Field,
    onBackground = InkText,
    onSurface = InkText,
    onSurfaceVariant = Mute,
    outline = Hairline,
    error = Danger,
    tertiary = Success,
)

@Composable
fun SkyDownTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = Scheme,
        typography = Typography,
        content = content,
    )
}
