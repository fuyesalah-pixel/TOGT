plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
    id("com.google.gms.google-services")
}

import java.util.Properties
import java.io.FileInputStream

val signingProperties = Properties()
// Resolve signing config from (in priority order):
//  1. ANDROID_KEYSTORE_PROPERTIES env var (CI injects an absolute path)
//  2. C:/keys/togt-keystore.properties (legacy Windows dev machine)
//  3. key.properties in the android/ dir (Flutter convention, gitignored)
val envProps = System.getenv("ANDROID_KEYSTORE_PROPERTIES")
val legacyProps = file("C:/keys/togt-keystore.properties")
val repoProps = file("../key.properties") // <app>/.. => android/key.properties
val signingFile = when {
    envProps != null && File(envProps).exists() -> File(envProps)
    legacyProps.exists() -> legacyProps
    repoProps.exists() -> repoProps
    else -> null
}
if (signingFile != null) FileInputStream(signingFile).use { signingProperties.load(it) }

// Root of the Flutter `android/` directory (parent of this `app/` module),
// used to resolve the keystore and the repo-local key.properties.
val androidDir = projectDir.parentFile

android {
    namespace = "com.togt.travel"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
        isCoreLibraryDesugaringEnabled = true
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.togt.travel"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        // Uses the version code from pubspec.yaml. When using split APKs, 1000 * ABI_VERSION
        // is added automatically by Flutter. (https://developer.android.com/studio/build/configure-apk-splits#configure-APK-versions)
        // You can force using the value of versionCode by specifying the `-P force-version-code-ignoring-abi=true`
        // flag during build.
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        create("release") {
            if (signingFile != null && signingProperties.isNotEmpty()) {
                val rawStore = signingProperties["storeFile"] as String
                val candidate = File(rawStore)
                storeFile = if (candidate.isAbsolute) candidate else androidDir.resolve(rawStore)
                storePassword = signingProperties["storePassword"] as String
                keyAlias = signingProperties["keyAlias"] as String
                keyPassword = signingProperties["keyPassword"] as String
            }
        }
    }

    buildTypes {
        release {
            // TODO: Add your own signing config for the release build.
            // Signing with the debug keys for now, so `flutter run --release` works.
            signingConfig = signingConfigs.getByName("release")
        }
    }
}

dependencies {
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.5")
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
