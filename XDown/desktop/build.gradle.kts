import org.jetbrains.compose.desktop.application.dsl.TargetFormat

plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.jetbrains.compose)
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(17))
    }
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
        mainClass = "com.xdown.desktop.MainKt"
        nativeDistributions {
            targetFormats(TargetFormat.Msi)
            packageName = "XDown"
            packageVersion = "1.0.0"
            description = "Baixar mídia de perfis públicos do X"
            vendor = "C0tr4x"
            windows {
                iconFile.set(project.file("icons/icon.ico"))
                menuGroup = "XDown"
                upgradeUuid = "8c0e5d6a-4b21-4f3e-9c11-7a9e2b4d1f08"
                shortcut = true
                menu = true
                dirChooser = true
            }
        }
    }
}

afterEvaluate {
    tasks.named("packageMsi").configure {
        doLast {
            val msiDir = layout.buildDirectory.dir("compose/binaries/main/msi").get().asFile
            val msi = msiDir.listFiles()?.firstOrNull { it.extension.equals("msi", ignoreCase = true) }
                ?: return@doLast
            val destDir = rootProject.layout.projectDirectory.dir("release").asFile
            destDir.mkdirs()
            msi.copyTo(destDir.resolve("XDown-1.0.0.msi"), overwrite = true)
        }
    }
}
