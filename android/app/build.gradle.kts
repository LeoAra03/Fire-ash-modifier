plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.pokemod.fireash"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.pokemod.fireash"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
        debug {
            applicationIdSuffix = ".debug"
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

// La app web vive en /web y se empaqueta como assets (una sola fuente de verdad).
tasks.register("copyWebAssets", Copy::class) {
    from("${rootDir}/../web") {
        exclude("**/*.test.mjs")
    }
    into("src/main/assets/web")
}
tasks.named("preBuild") { dependsOn("copyWebAssets") }

dependencies {
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("androidx.documentfile:documentfile:1.0.1")
}
