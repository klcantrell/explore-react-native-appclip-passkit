package com.explorereactnativeappclippasskit

import android.content.Context
import android.content.res.Resources
import android.util.TypedValue
import android.widget.FrameLayout
import android.widget.ImageView
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.annotations.ReactProp

private const val REACT_CLASS = "AddPassButton"

class AddPassButtonManager : SimpleViewManager<AddButtonView>() {
    override fun getName(): String = REACT_CLASS

    override fun createViewInstance(reactContext: ThemedReactContext): AddButtonView {
        return AddButtonView(reactContext)
    }

    @ReactProp(name = ViewProps.HEIGHT)
    fun setHeight(view: AddButtonView, height: Int) {
        view.findViewById<FrameLayout>(R.id.container).layoutParams.height =
            TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP,
                height.toFloat(),
                Resources.getSystem().displayMetrics
            )
                .toInt()
    }

    @ReactProp(name = ViewProps.WIDTH)
    fun setWidth(view: AddButtonView, width: Int) {
        view.findViewById<ImageView>(R.id.image).layoutParams.width =
            TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP,
                width.toFloat(),
                Resources.getSystem().displayMetrics
            )
                .toInt()
    }
}

class AddButtonView(context: Context) : FrameLayout(context) {
    init {
        inflate(context, R.layout.rn_add_to_google_wallet_button, this)
    }
}
