package com.dayora

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * React Native Java Module for Dayora local notifications, alarm scheduling,
 * and celebration music playback.
 */
class DayoraNotificationModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "DayoraNotificationModule"

    override fun initialize() {
        super.initialize()
        DayoraAlarmReceiver.ensureNotificationChannels(reactContext)
    }

    @ReactMethod
    fun createNotificationChannels(promise: Promise) {
        try {
            DayoraAlarmReceiver.ensureNotificationChannels(reactContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CHANNEL_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun scheduleNotification(
        id: String,
        code: Double,
        channelId: String,
        title: String,
        body: String,
        triggerTimeMs: Double,
        type: String,
        referenceId: String,
        payloadJson: String,
        promise: Promise
    ) {
        try {
            val intCode = code.toInt()
            val triggerMs = triggerTimeMs.toLong()
            val alarmManager = reactContext.getSystemService(Context.ALARM_SERVICE) as? AlarmManager

            if (alarmManager == null) {
                promise.reject("ALARM_ERROR", "AlarmManager service not available")
                return
            }

            val alarmIntent = Intent(reactContext, DayoraAlarmReceiver::class.java).apply {
                putExtra("code", intCode)
                putExtra("channel_id", channelId)
                putExtra("title", title)
                putExtra("body", body)
                putExtra("type", type)
                putExtra("reference_id", referenceId)
                putExtra("payload_json", payloadJson)
            }

            val pendingIntent = PendingIntent.getBroadcast(
                reactContext,
                intCode,
                alarmIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (alarmManager.canScheduleExactAlarms()) {
                    alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        triggerMs,
                        pendingIntent
                    )
                } else {
                    alarmManager.setAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        triggerMs,
                        pendingIntent
                    )
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerMs,
                    pendingIntent
                )
            } else {
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    triggerMs,
                    pendingIntent
                )
            }

            Log.d(TAG, "Scheduled alarm #$intCode for triggerMs=$triggerMs (title=$title)")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "scheduleNotification error", e)
            promise.reject("SCHEDULE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun cancelNotification(code: Double, promise: Promise) {
        try {
            val intCode = code.toInt()
            val alarmManager = reactContext.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
            val alarmIntent = Intent(reactContext, DayoraAlarmReceiver::class.java)

            val pendingIntent = PendingIntent.getBroadcast(
                reactContext,
                intCode,
                alarmIntent,
                PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
            )

            if (pendingIntent != null && alarmManager != null) {
                alarmManager.cancel(pendingIntent)
                pendingIntent.cancel()
            }

            Log.d(TAG, "Cancelled alarm #$intCode")
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CANCEL_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun cancelAllNotifications(promise: Promise) {
        // Handled via individual codes through SQLite database reconciliation
        promise.resolve(true)
    }

    @ReactMethod
    fun getInitialNotification(promise: Promise) {
        try {
            val initial = initialNotificationData
            initialNotificationData = null // consume once
            promise.resolve(initial)
        } catch (e: Exception) {
            promise.reject("INITIAL_NOTIFICATION_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun playBirthdayTune(promise: Promise) {
        try {
            DayoraSoundSynthesizer.play()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SOUND_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopBirthdayTune(promise: Promise) {
        try {
            DayoraSoundSynthesizer.stop()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SOUND_ERROR", e.message, e)
        }
    }

    companion object {
        private const val TAG = "DayoraNotifModule"
        var initialNotificationData: WritableMap? = null

        fun handleIntent(intent: Intent?, reactContext: ReactContext?) {
            try {
                if (intent == null) return
                val isFromNotification = intent.getBooleanExtra("is_from_notification", false)
                if (!isFromNotification) return

                val type = intent.getStringExtra("notification_type") ?: ""
                val referenceId = intent.getStringExtra("reference_id") ?: ""
                val payloadJson = intent.getStringExtra("payload_json") ?: ""
                val code = intent.getIntExtra("notification_code", 0)

                val map = Arguments.createMap().apply {
                    putString("type", type)
                    putString("referenceId", referenceId)
                    putString("payloadJson", payloadJson)
                    putInt("code", code)
                }

                initialNotificationData = map

                if (reactContext != null && reactContext.hasActiveReactInstance()) {
                    reactContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        ?.emit("onDayoraNotificationClick", map)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Safe intent handling caught exception", e)
            }
        }
    }
}
