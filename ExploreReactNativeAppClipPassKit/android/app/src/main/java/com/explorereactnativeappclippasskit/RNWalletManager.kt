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
private const val newObjectJwt = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ3YWxsZXQtc3Bpa2Utd2ViLWNsaWVudEB3YWxsZXQtc3Bpa2Utd2ViLWNsaWVudC5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsImF1ZCI6Imdvb2dsZSIsIm9yaWdpbnMiOlsibG9jYWxob3N0OjMwMDAiXSwidHlwIjoic2F2ZXRvd2FsbGV0IiwicGF5bG9hZCI6eyJsb3lhbHR5T2JqZWN0cyI6W3siaWQiOiIzMzg4MDAwMDAwMDIyMTMwMDU4LnRlc3RVc2VyMTIzLXBhc3MuY29tLmV4cGxvcmVyZWFjdG5hdGl2ZWFwcGNsaXBwYXNza2l0In1dfSwiaWF0IjoxNjYyODMxNjc0fQ.IcBIEaejsDtXqH_Sda3zEm8_DMb2XCxIcD6hfa13zfDW7f88HKJcx6XkZsSzQrtAuRtXMSVqIO0LrphulpJ5DBZ41vjcA7x9A2Kq0u0NPDok2XLAqA8pwbnNnmZ_w0NNHMaOct9kOxJxWEJs_Xjdh6yTYYwkLyJ32xfmOxs9lmCTwe_SaEEenF0Ghe55hV3gY_1GfxA8w6-F364yz_Znhgn8ewlpvhIx5V6xv2Ag-4Lze7r0Lg815l-4F7MyrkmCI5NtdyYyurWFOAmS8sEiL55a0pgWEojXHGI2cQZCZZqox2WgRd04xdWpGtWU85v2dX9DRsf4FHDbR26OZJ1n8w"

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
