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

private const val issuerEmail = "cantrellkalalau@gmail.com"
private const val addToGoogleWalletRequestCode = 1000

private const val SHARED_PREFERENCES_KEY = "explorereactnativeappclippasskit.key"
private const val KEY_TEST = "test.key"

// loyalty object below is hard-coded response that would come from a backend endpoint
private val newObjectJson = """
    {
      "iss": "$issuerEmail",
      "aud": "google",
      "typ": "savetowallet",
      "iat": ${Date().time / 1000L},
      "origins": [],
      "payload": {
        "loyaltyObjects": [
            {
                "kind": "walletobjects#loyaltyObject",
                "classReference": {
                    "kind": "walletobjects#loyaltyClass",
                    "programLogo": {
                        "kind": "walletobjects#image",
                        "sourceUri": {
                            "uri": "https://storage.googleapis.com/wallet-lab-tools-codelab-artifacts-public/pass_google_logo.jpg"
                        }
                    },
                    "localizedProgramName": {
                        "kind": "walletobjects#localizedString",
                        "defaultValue": {
                            "kind": "walletobjects#translatedString",
                            "language": "en",
                            "value": "Spike Google Wallet Passes"
                        }
                    },
                    "id": "3388000000022130058.pass.com.explorereactnativeappclippasskit",
                    "version": "1",
                    "allowMultipleUsersPerObject": false,
                    "reviewStatus": "approved",
                    "countryCode": "US",
                    "heroImage": {
                        "kind": "walletobjects#image",
                        "sourceUri": {
                            "uri": "https://farm4.staticflickr.com/3723/11177041115_6e6a3b6f49_o.jpg"
                        }
                    },
                    "enableSmartTap": false,
                    "hexBackgroundColor": "#00a8e4",
                    "localizedIssuerName": {
                        "kind": "walletobjects#localizedString",
                        "defaultValue": {
                            "kind": "walletobjects#translatedString",
                            "language": "en",
                            "value": "cantrellkalalau@gmail.com"
                        }
                    },
                    "multipleDevicesAndHoldersAllowedStatus": "oneUserOneDevice"
                },
                "accountName": "Kal Cantrell",
                "accountId": "testUser123",
                "loyaltyPoints": {
                    "label": "Bottles Avoided",
                    "balance": {
                        "int": 47
                    }
                },
                "id": "3388000000022130058.testUser123-pass.com.explorereactnativeappclippasskit",
                "classId": "3388000000022130058.pass.com.explorereactnativeappclippasskit",
                "version": "1",
                "state": "active",
                "barcode": {
                    "kind": "walletobjects#barcode",
                    "type": "qrCode",
                    "value": "kajsdhlkajshdklajshdlk"
                },
                "hasUsers": false,
                "hasLinkedDevice": false
            }
        ]
      }
    }
    """

// loyalty JWT below is hard-coded response that would come from a backend endpoint
private const val newObjectJwt = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ3YWxsZXQtc3Bpa2Utd2ViLWNsaWVudEB3YWxsZXQtc3Bpa2Utd2ViLWNsaWVudC5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsImF1ZCI6Imdvb2dsZSIsIm9yaWdpbnMiOlsibG9jYWxob3N0OjMwMDAiXSwidHlwIjoic2F2ZXRvd2FsbGV0IiwicGF5bG9hZCI6eyJsb3lhbHR5T2JqZWN0cyI6W3siaWQiOiIzMzg4MDAwMDAwMDIyMTMwMDU4LnRlc3RVc2VyMTIzLXBhc3MuY29tLmV4cGxvcmVyZWFjdG5hdGl2ZWFwcGNsaXBwYXNza2l0In1dfSwiaWF0IjoxNjYyODMxNjc0fQ.IcBIEaejsDtXqH_Sda3zEm8_DMb2XCxIcD6hfa13zfDW7f88HKJcx6XkZsSzQrtAuRtXMSVqIO0LrphulpJ5DBZ41vjcA7x9A2Kq0u0NPDok2XLAqA8pwbnNnmZ_w0NNHMaOct9kOxJxWEJs_Xjdh6yTYYwkLyJ32xfmOxs9lmCTwe_SaEEenF0Ghe55hV3gY_1GfxA8w6-F364yz_Znhgn8ewlpvhIx5V6xv2Ag-4Lze7r0Lg815l-4F7MyrkmCI5NtdyYyurWFOAmS8sEiL55a0pgWEojXHGI2cQZCZZqox2WgRd04xdWpGtWU85v2dX9DRsf4FHDbR26OZJ1n8w"

class InstantActivity : AppCompatActivity() {
    private lateinit var walletClient: PayClient

    private val viewModel = InstantViewModel()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val preferences = getSharedPreferences(SHARED_PREFERENCES_KEY, Context.MODE_PRIVATE)

        Log.d(
            "KLC",
            preferences.getString(KEY_TEST, "DEF VALUE FOR SHARED PREFERENCES")
                ?: "NOTHING IN SHARED PREFERENCES"
        )

        val editor = preferences.edit()
        editor.putString(KEY_TEST, "TEST_VALUE_123")
        editor.apply()

        Log.d(
            "KLC",
            preferences.getString(KEY_TEST, "DEF VALUE FOR SHARED PREFERENCES")
                ?: "NOTHING IN SHARED PREFERENCES"
        )

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
                                            walletClient.savePassesJwt(
                                                newObjectJwt,
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
                    Toast.makeText(this, "Something went wrong: $errorMessage", Toast.LENGTH_LONG)
                        .show()
                }

                else -> {
                    // Handle unexpected (non-API) exception
                    Toast.makeText(
                        this,
                        "Something went haywire. Please try again.",
                        Toast.LENGTH_LONG
                    ).show()
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
