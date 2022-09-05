plugins {
    id("com.android.dynamic-feature")
    id("org.jetbrains.kotlin.android")
}
android {
    compileSdk = 32

    defaultConfig {
        minSdk = 26
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildFeatures {
        compose = true
    }

    // Set both the Java and Kotlin compilers to target Java 8.
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.3.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}

val kotlin_version: String by rootProject.extra

dependencies {
    implementation(project(":app"))
    implementation("androidx.core:core-ktx:1.7.0")
    implementation("org.jetbrains.kotlin:kotlin-stdlib:$kotlin_version")
    implementation("androidx.appcompat:appcompat:1.5.0")
    // [Compose] Integration with activities
    implementation("androidx.activity:activity-compose:1.5.1")
    // [Compose] Material Design
    implementation("androidx.compose.material:material:1.2.1")
    // [Compose] Animations
    implementation("androidx.compose.animation:animation:1.2.1")
    // [Compose] Tooling support (Previews, etc.)
    implementation("androidx.compose.ui:ui-tooling:1.2.1")
    // [Compose] Integration with ViewModels
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.5.1")
    // [Compose] Update system UI (status bar, action bar, navigation bar)
    implementation("com.google.accompanist:accompanist-systemuicontroller:0.25.1")

    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.3")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.4.0")
    androidTestImplementation("androidx.annotation:annotation:1.4.0")
    // [Compose] UI Tests
    androidTestImplementation("androidx.compose.ui:ui-test-junit4:1.2.1")
}
