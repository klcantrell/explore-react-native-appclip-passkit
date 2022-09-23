package com.explorereactnativeappclippasskit

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
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
import androidx.compose.ui.res.dimensionResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.explorereactnativeappclippasskit.ui.theme.InstantAppTheme
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
                    "multipleDevicesAndHoldersAllowedStatus": "oneUserAllDevices"
                },
                "accountName": "Kal12",
                "accountId": "testUser12",
                "loyaltyPoints": {
                    "label": "Bottles Avoided",
                    "balance": {
                        "int": 47
                    }
                },
                "id": "3388000000022130058.testUser12-pass.com.explorereactnativeappclippasskit",
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
private const val newObjectJwt =
    "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ3YWxsZXQtc3Bpa2Utd2ViLWNsaWVudEB3YWxsZXQtc3Bpa2Utd2ViLWNsaWVudC5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsImF1ZCI6Imdvb2dsZSIsIm9yaWdpbnMiOlsibG9jYWxob3N0OjMwMDAiXSwidHlwIjoic2F2ZXRvd2FsbGV0IiwicGF5bG9hZCI6eyJsb3lhbHR5T2JqZWN0cyI6W3siaWQiOiIzMzg4MDAwMDAwMDIyMTMwMDU4LnRlc3RVc2VyMTItcGFzcy5jb20uZXhwbG9yZXJlYWN0bmF0aXZlYXBwY2xpcHBhc3NraXQifV19LCJpYXQiOjE2NjM1NDQyNDd9.l60hWD7lQmyO7BvuskYqM_mxebv_wddN9LXjfN_sI41JhjszLcNutGFVv-JTZ8A8L2tePsn5s8rtLtOEawf8rdBbgg2-fJIxq2zveRZrTAO6ZOMKe02ViluvyfCNFfK3LJvn_Z_yX43wOnuZZcoxVZopvPLif3KygDjGi-LHkXM05b5Rf3RWic6kk2IVNWsdBYSWOwWcbLhFyQ2k45xHJm2IqoLWYS9HJ565B_PemA0gC6PKvHec7B5M7wT3hjBnf1IJYS0Urxu0FI2ef_YudgiwbXagqt404F3pHbr3Y1iwbJuEvQblrs2x8txZdGjvvcMXiwHzwSK4ecnj0FsblQ"


class MainActivity : ComponentActivity() {
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

        setContent {
            InstantAppTheme {
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
                            modifier = Modifier.height(60.dp),
                            factory = {
                                val view = View.inflate(
                                    it,
                                    R.layout.add_to_google_wallet_button,
                                    null
                                )
                                view.setOnClickListener {
                                    walletClient.savePassesJwt(
                                        newObjectJwt,
                                        this@MainActivity,
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

class InstantViewModel : ViewModel() {
    val googleWalletEnabled = MutableLiveData<Boolean?>(null)
}

@Composable
private fun Title() {
    Text(
        text = stringResource(R.string.title),
        style = MaterialTheme.typography.h5,
    )
}

@Preview(showBackground = true)
@Composable
fun DefaultPreview() {
    InstantAppTheme {
        Title()
    }
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