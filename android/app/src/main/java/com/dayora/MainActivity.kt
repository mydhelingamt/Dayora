package com.dayora

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
    try {
      val reactContext = getSafeReactContext()
      DayoraNotificationModule.handleIntent(intent, reactContext)
    } catch (e: Exception) {
      // Never allow intent processing to crash activity startup
    }
  }

  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    setIntent(intent)
    try {
      val reactContext = getSafeReactContext()
      DayoraNotificationModule.handleIntent(intent, reactContext)
    } catch (e: Exception) {
      // Never allow intent processing to crash activity lifecycle
    }
  }

  private fun getSafeReactContext(): com.facebook.react.bridge.ReactContext? {
    return try {
      (application as? com.facebook.react.ReactApplication)?.reactHost?.currentReactContext
    } catch (_: Exception) {
      null
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "Dayora"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
