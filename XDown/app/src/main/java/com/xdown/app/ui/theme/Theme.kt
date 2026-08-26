package com.xdown.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val Scheme = darkColorScheme(
    primary = XBlue,
    onPrimary = Snow,
    secondary = XCyan,
    background = Ink,
    surface = Ink,
    surfaceVariant = InkElevated,
    onBackground = Snow,
    onSurface = Snow,
    onSurfaceVariant = Mute,
    outline = Hairline,
    error = Danger,
    tertiary = Success,
)

@Composable
fun XDownTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = Scheme,
        typography = Typography,
        content = content,
    )
}
