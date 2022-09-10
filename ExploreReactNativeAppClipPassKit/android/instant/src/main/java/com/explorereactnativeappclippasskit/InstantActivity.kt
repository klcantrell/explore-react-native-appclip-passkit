package com.explorereactnativeappclippasskit

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.res.dimensionResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.google.accompanist.systemuicontroller.rememberSystemUiController
import com.google.android.gms.pay.Pay
import com.google.android.gms.pay.PayApiAvailabilityStatus
import com.google.android.gms.pay.PayClient
import com.google.android.gms.pay.PayClient.SavePassesResult.SAVE_ERROR
import java.util.*
import kotlin.random.Random.Default.nextInt

private const val issuerEmail = "cantrellkalalau@gmail.com"
private const val issuerId = "3388000000022129788"
private const val passClass = "3388000000022129788.8b349263-2b4b-4bd6-b609-eade3f734a07"
private val passId = UUID.randomUUID().toString()
private const val addToGoogleWalletRequestCode = 1000

private const val SHARED_PREFERENCES_KEY = "explorereactnativeappclippasskit.key"
private const val KEY_TEST = "test.key"

private val newObjectJson = """
    {
      "iss": "$issuerEmail",
      "aud": "google",
      "typ": "savetowallet",
      "iat": ${Date().time / 1000L},
      "origins": [],
      "payload": {
        "genericObjects": [
          {
            "id": "$issuerId.$passId",
            "classId": "$passClass",
            "genericType": "GENERIC_TYPE_UNSPECIFIED",
            "hexBackgroundColor": "#4285f4",
            "logo": {
              "sourceUri": {
                "uri": "https://storage.googleapis.com/wallet-lab-tools-codelab-artifacts-public/pass_google_logo.jpg"
              }
            },
            "cardTitle": {
              "defaultValue": {
                "language": "en",
                "value": "Google I/O '22  [DEMO ONLY]"
              }
            },
            "subheader": {
              "defaultValue": {
                "language": "en",
                "value": "Attendee"
              }
            },
            "header": {
              "defaultValue": {
                "language": "en",
                "value": "Kal Cantrell"
              }
            },
            "barcode": {
              "type": "QR_CODE",
              "value": "$passId"
            },
            "heroImage": {
              "sourceUri": {
                "uri": "https://storage.googleapis.com/wallet-lab-tools-codelab-artifacts-public/google-io-hero-demo-only.jpg"
              }
            },
            "textModulesData": [
              {
                "header": "POINTS",
                "body": "${nextInt(0, 9999)}",
                "id": "points"
              },
              {
                "header": "CONTACTS",
                "body": "${nextInt(1, 99)}",
                "id": "contacts"
              }
            ]
          }
        ]
      }
    }
    """

class InstantActivity : AppCompatActivity() {
    private lateinit var walletClient: PayClient

    private val viewModel = InstantViewModel()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val preferences = getSharedPreferences(SHARED_PREFERENCES_KEY, Context.MODE_PRIVATE)

        Log.d("KLC", preferences.getString(KEY_TEST, "DEF VALUE FOR SHARED PREFERENCES") ?: "NOTHING IN SHARED PREFERENCES")

        val editor = preferences.edit()
        editor.putString(KEY_TEST, "TEST_VALUE_123")
        editor.apply()

        Log.d("KLC", preferences.getString(KEY_TEST, "DEF VALUE FOR SHARED PREFERENCES") ?: "NOTHING IN SHARED PREFERENCES")

        walletClient = Pay.getClient(this)
        fetchCanUseGoogleWalletApi()

        setContentView(
            ComposeView(this).apply {
                setContent {
                    val systemUiController = rememberSystemUiController()
                    val useDarkIcons = !isSystemInDarkTheme()
                    val googleWalletEnabled: Boolean? by viewModel.googleWalletEnabled.observeAsState(
                        null
                    )

                    SideEffect {
                        systemUiController.setStatusBarColor(
                            Color.Transparent,
                            darkIcons = useDarkIcons
                        )
                        systemUiController.setNavigationBarColor(
                            LightGray,
                            darkIcons = useDarkIcons
                        )
                    }

                    MyComposeApplicationTheme {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .fillMaxHeight()
                                .padding(horizontal = dimensionResource(R.dimen.margin_small)),
                            verticalArrangement = Arrangement.Center,
                            horizontalAlignment = Alignment.CenterHorizontally,
                        ) {
                            Title()
                            Spacer(modifier = Modifier.height(dimensionResource(R.dimen.margin_small)))
                            if (googleWalletEnabled == null) {
                                CircularProgressIndicator()
                            }
                            if (googleWalletEnabled == true) {
                                AndroidView(
                                    modifier = Modifier.height(50.dp),
                                    factory = {
                                        val view = View.inflate(
                                            it,
                                            R.layout.add_to_google_wallet_button,
                                            null
                                        )
                                        view.setOnClickListener {
                                            walletClient.savePasses(
                                                newObjectJson,
                                                this@InstantActivity,
                                                addToGoogleWalletRequestCode
                                            )
                                        }
                                        view
                                    }
                                )
                            }
                        }
                    }
                }
            }
        )
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)

        if (requestCode == addToGoogleWalletRequestCode) {
            when (resultCode) {
                RESULT_OK -> {
                    // Pass saved successfully. Consider informing the user.
                    Toast.makeText(this, "You saved the pass!", Toast.LENGTH_LONG).show()
                }
                RESULT_CANCELED -> {
                    // Save canceled
                    Toast.makeText(this, "You canceled the save :(", Toast.LENGTH_LONG).show()
                }

                SAVE_ERROR -> data?.let { intentData ->
                    val errorMessage = intentData.getStringExtra(PayClient.EXTRA_API_ERROR_MESSAGE)
                    // Handle error. Consider informing the user.
                    Toast.makeText(this, "Something went wrong: $errorMessage", Toast.LENGTH_LONG).show()
                }

                else -> {
                    // Handle unexpected (non-API) exception
                    Toast.makeText(this, "Something went haywire. Please try again.", Toast.LENGTH_LONG).show()
                }
            }
        }
    }


    private fun fetchCanUseGoogleWalletApi() {
        walletClient
            .getPayApiAvailabilityStatus(PayClient.RequestType.SAVE_PASSES)
            .addOnSuccessListener { status ->
                if (status == PayApiAvailabilityStatus.AVAILABLE) {
                    viewModel.googleWalletEnabled.value = true
                }
            }
            .addOnFailureListener {
                Log.d("KLC", "Pay API not available ${it.localizedMessage}")
                Log.d("KLC", "Pay API not available ${it.cause}")
                Log.d("KLC", "Pay API not available ${it.stackTrace}")
                viewModel.googleWalletEnabled.value = false
            }
    }
}

@Composable
private fun Title() {
    Text(
        text = stringResource(R.string.title),
        style = MaterialTheme.typography.h5,
    )
}

@Composable
fun MyComposeApplicationTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) {
        DarkColorPalette
    } else {
        LightColorPalette
    }

    MaterialTheme(
        colors = colors,
        typography = Typography,
        shapes = Shapes,
        content = content
    )
}

class InstantViewModel : ViewModel() {
    val googleWalletEnabled = MutableLiveData<Boolean?>(null)
}

// Color tokens

val Purple200 = Color(0xFFBB86FC)
val Purple500 = Color(0xFF6200EE)
val Purple700 = Color(0xFF3700B3)
val Teal200 = Color(0xFF03DAC5)
val LightGray = Color(0xFFEDEDED)

private val DarkColorPalette = darkColors(
    primary = Purple200,
    primaryVariant = Purple700,
    secondary = Teal200
)

private val LightColorPalette = lightColors(
    primary = Purple500,
    primaryVariant = Purple700,
    secondary = Teal200

    /* Other default colors to override
    background = Color.White,
    surface = Color.White,
    onPrimary = Color.White,
    onSecondary = Color.Black,
    onBackground = Color.Black,
    onSurface = Color.Black,
    */
)

// Shapes

val Shapes = Shapes(
    small = RoundedCornerShape(4.dp),
    medium = RoundedCornerShape(4.dp),
    large = RoundedCornerShape(0.dp)
)

// Set of Material typography styles to start with

val Typography = Typography(
    body1 = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp
    )
    /* Other default text styles to override
    button = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.W500,
        fontSize = 14.sp
    ),
    caption = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp
    )
    */
)
