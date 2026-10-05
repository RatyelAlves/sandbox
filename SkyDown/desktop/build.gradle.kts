import org.jetbrains.compose.desktop.application.dsl.TargetFormat

plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.jetbrains.compose)
}

java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

kotlin {
    jvmToolchain(17)
}

dependencies {
    implementation(project(":core"))
    implementation(compose.desktop.currentOs)
    implementation(compose.material3)
    implementation(compose.materialIconsExtended)
    implementation(libs.coil3.compose)
    implementation(libs.coil3.okhttp)
    implementation(libs.kotlinx.coroutines.swing)
}

compose.desktop {
    application {
        mainClass = "com.skydown.desktop.MainKt"
        nativeDistributions {
            targetFormats(TargetFormat.Msi)
            packageName = "SkyDown"
            packageVersion = "1.0.0"
            description = "Baixar mídia de perfis públicos do Bluesky"
            vendor = "RatyelAlves"
            windows {
                iconFile.set(project.file("icons/icon.ico"))
                menuGroup = "SkyDown"
                upgradeUuid = "c4e8a91b-6d27-4f50-9e13-8b2a7c5d0f14"
                shortcut = true
                menu = true
                dirChooser = true
            }
        }
    }
}
