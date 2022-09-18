package com.explorereactnativeappclippasskit

import android.app.Activity
import android.content.Intent
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.facebook.react.bridge.*
import com.google.android.gms.pay.Pay
import com.google.android.gms.pay.PayApiAvailabilityStatus
import com.google.android.gms.pay.PayClient

private const val addToGoogleWalletRequestCode = 1000

// loyalty JWT below is hard-coded response that would come from a backend endpoint
private const val newObjectJwt = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ3YWxsZXQtc3Bpa2Utd2ViLWNsaWVudEB3YWxsZXQtc3Bpa2Utd2ViLWNsaWVudC5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsImF1ZCI6Imdvb2dsZSIsIm9yaWdpbnMiOlsibG9jYWxob3N0OjMwMDAiXSwidHlwIjoic2F2ZXRvd2FsbGV0IiwicGF5bG9hZCI6eyJsb3lhbHR5T2JqZWN0cyI6W3siaWQiOiIzMzg4MDAwMDAwMDIyMTMwMDU4LnRlc3RVc2VyNy1wYXNzLmNvbS5leHBsb3JlcmVhY3RuYXRpdmVhcHBjbGlwcGFzc2tpdCJ9XX0sImlhdCI6MTY2MzUyNzEwM30.h_fY7m0Vi-AtmD9B4AfHHhcBsSoT0G5RcEMx79__jRp6ryIFoSL8goRV64X1Bk16gjl7yAofX7VEV9qlPmmDsL0PcDFdV2qvIqjeB31R11SLtCAflz5SexmID0vmNNP7Z9QFft0HrknDkSwXRIHk8IceKtJMwYOnCzkxsSCKTN0L_HCNgUbnPMEuA54k6IfKG3vufhcLxoE8van4anXzOPNfHfxXUGT5iRSvY9ScOslvhOjY0VETMjBw5on30LBtbmFNgFb4UpXMvy2EhZaW-brEi_4V0zUcVeOxw41kznzIh2pkbjlE5Gu3WnuDy1FimY0VgFBFA75uifqWIPYA5Q"

class RNWalletManager(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private var walletClient: PayClient = Pay.getClient(reactContext)

    private var onWalletSavedSuccessfully: (() -> Unit)? = null
    private var onWalletSavedFailure: (() -> Unit)? = null

    private val activityEventListener = object : BaseActivityEventListener() {
        override fun onActivityResult(
            activity: Activity?,
            requestCode: Int,
            resultCode: Int,
            data: Intent?
        ) {
            super.onActivityResult(activity, requestCode, resultCode, data)

            if (requestCode == addToGoogleWalletRequestCode) {
                when (resultCode) {
                    AppCompatActivity.RESULT_OK -> {
                        // Pass saved successfully. Consider informing the user.
                        Toast.makeText(activity, "You saved the pass!", Toast.LENGTH_LONG).show()
                        onWalletSavedSuccessfully?.invoke()
                    }
                    AppCompatActivity.RESULT_CANCELED -> {
                        // Save canceled
                        Toast.makeText(activity, "You canceled the save :(", Toast.LENGTH_LONG)
                            .show()
                        onWalletSavedFailure?.invoke()
                    }

                    PayClient.SavePassesResult.SAVE_ERROR -> data?.let { intentData ->
                        val errorMessage =
                            intentData.getStringExtra(PayClient.EXTRA_API_ERROR_MESSAGE)
                        // Handle error. Consider informing the user.
                        Toast.makeText(
                            activity,
                            "Something went wrong: $errorMessage",
                            Toast.LENGTH_LONG
                        )
                            .show()
                        onWalletSavedFailure?.invoke()
                    }

                    else -> {
                        // Handle unexpected (non-API) exception
                        Toast.makeText(
                            reactContext.currentActivity!!,
                            "Something went haywire. Please try again.",
                            Toast.LENGTH_LONG
                        ).show()
                        onWalletSavedFailure?.invoke()
                    }
                }
                onWalletSavedSuccessfully = null
                onWalletSavedFailure = null
            }
        }
    }

    init {
        reactContext.addActivityEventListener(activityEventListener)
    }

    override fun getName(): String {
        return "RNWalletManager"
    }

    @ReactMethod
    fun isGoogleWalletApiAvailable(promise: Promise) {
        walletClient
            .getPayApiAvailabilityStatus(PayClient.RequestType.SAVE_PASSES)
            .addOnSuccessListener { status ->
                if (status == PayApiAvailabilityStatus.AVAILABLE) {
                    promise.resolve(true)
                }
            }
            .addOnFailureListener {
                Log.d("KLC", "Pay API not available ${it.localizedMessage}")
                Log.d("KLC", "Pay API not available ${it.cause}")
                Log.d("KLC", "Pay API not available ${it.stackTrace}")
                promise.resolve(false)
            }
    }

    @ReactMethod
    fun downloadWalletPassFromUrl(url: String, promise: Promise) {
        onWalletSavedSuccessfully = { promise.resolve(null) }
        onWalletSavedFailure = { promise.reject("Error code", "Error message") }
        walletClient.savePassesJwt(
            newObjectJwt,
            reactApplicationContext.currentActivity!!,
            addToGoogleWalletRequestCode
        )
    }

    @ReactMethod
    fun hasPass(passIdentifier: String, serialNumber: String, promise: Promise) {
        promise.resolve(false)
    }
}
