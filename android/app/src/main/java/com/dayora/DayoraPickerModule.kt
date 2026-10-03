package com.dayora

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.text.format.DateFormat
import com.facebook.react.bridge.*
import java.util.Calendar

class DayoraPickerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "DayoraPicker"

    @ReactMethod
    fun openDatePicker(options: ReadableMap, promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "Activity does not exist")
            return
        }

        activity.runOnUiThread {
            try {
                val now = Calendar.getInstance()
                val year = if (options.hasKey("year") && !options.isNull("year")) options.getInt("year") else now.get(Calendar.YEAR)
                val month = if (options.hasKey("month") && !options.isNull("month")) options.getInt("month") - 1 else now.get(Calendar.MONTH)
                val day = if (options.hasKey("day") && !options.isNull("day")) options.getInt("day") else now.get(Calendar.DAY_OF_MONTH)

                val theme = if (options.hasKey("theme")) options.getString("theme") else "dark"
                val themeResId = when (theme) {
                    "light" -> android.R.style.Theme_DeviceDefault_Light_Dialog
                    "golden" -> R.style.DayoraGoldenPickerDialog
                    else -> android.R.style.Theme_DeviceDefault_Dialog
                }

                var isResolved = false
                val dialog = DatePickerDialog(activity, themeResId, { _, selectedYear, selectedMonth, selectedDay ->
                    if (!isResolved) {
                        isResolved = true
                        val result = Arguments.createMap().apply {
                            putString("action", "dateSet")
                            putInt("year", selectedYear)
                            putInt("month", selectedMonth + 1)
                            putInt("day", selectedDay)
                        }
                        promise.resolve(result)
                    }
                }, year, month, day)

                if (options.hasKey("minDate") && !options.isNull("minDate")) {
                    dialog.datePicker.minDate = options.getDouble("minDate").toLong()
                }
                if (options.hasKey("maxDate") && !options.isNull("maxDate")) {
                    dialog.datePicker.maxDate = options.getDouble("maxDate").toLong()
                }

                dialog.setOnDismissListener {
                    if (!isResolved) {
                        isResolved = true
                        val result = Arguments.createMap().apply {
                            putString("action", "dismissed")
                        }
                        promise.resolve(result)
                    }
                }

                dialog.show()
            } catch (e: Exception) {
                promise.reject("E_PICKER_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun openTimePicker(options: ReadableMap, promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "Activity does not exist")
            return
        }

        activity.runOnUiThread {
            try {
                val now = Calendar.getInstance()
                val hour = if (options.hasKey("hour") && !options.isNull("hour")) options.getInt("hour") else now.get(Calendar.HOUR_OF_DAY)
                val minute = if (options.hasKey("minute") && !options.isNull("minute")) options.getInt("minute") else now.get(Calendar.MINUTE)
                val is24Hour = if (options.hasKey("is24Hour") && !options.isNull("is24Hour")) options.getBoolean("is24Hour") else DateFormat.is24HourFormat(activity)

                val theme = if (options.hasKey("theme")) options.getString("theme") else "dark"
                val themeResId = when (theme) {
                    "light" -> android.R.style.Theme_DeviceDefault_Light_Dialog
                    "golden" -> R.style.DayoraGoldenPickerDialog
                    else -> android.R.style.Theme_DeviceDefault_Dialog
                }

                var isResolved = false
                val dialog = TimePickerDialog(activity, themeResId, { _, selectedHour, selectedMinute ->
                    if (!isResolved) {
                        isResolved = true
                        val result = Arguments.createMap().apply {
                            putString("action", "timeSet")
                            putInt("hour", selectedHour)
                            putInt("minute", selectedMinute)
                        }
                        promise.resolve(result)
                    }
                }, hour, minute, is24Hour)

                dialog.setOnDismissListener {
                    if (!isResolved) {
                        isResolved = true
                        val result = Arguments.createMap().apply {
                            putString("action", "dismissed")
                        }
                        promise.resolve(result)
                    }
                }

                dialog.show()
            } catch (e: Exception) {
                promise.reject("E_PICKER_ERROR", e.message, e)
            }
        }
    }
}
