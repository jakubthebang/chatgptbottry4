plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.jakubthebang.cloudgaming"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.jakubthebang.cloudgaming"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
    }
}

kotlin { jvmToolchain(17) }

