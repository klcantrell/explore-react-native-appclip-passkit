package com.explorereactnativeappclippasskit

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WalletManager(reactContext: ReactApplicationContext): ReactContextBaseJavaModule(reactContext) {
    @ReactMethod
    fun hasPass(passIdentifier: String, serialNumber: String, promise: Promise) {
        promise.resolve(false)
    }

    override fun getName(): String {
        return "RNWalletManager"
    }
}
