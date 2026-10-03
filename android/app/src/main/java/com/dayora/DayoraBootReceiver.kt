package com.dayora

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.database.sqlite.SQLiteDatabase
import android.os.Build
import android.util.Log

/**
 * BroadcastReceiver responsible for restoring scheduled AlarmManager alarms after
 * device restart (BOOT_COMPLETED) or system timezone / clock changes.
 * Reads directly from the local SQLite database to guarantee reliable offline delivery.
 */
class DayoraBootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        Log.d(TAG, "DayoraBootReceiver onReceive: action=$action")

        if (
            action == Intent.ACTION_BOOT_COMPLETED ||
            action == Intent.ACTION_TIMEZONE_CHANGED ||
            action == Intent.ACTION_TIME_CHANGED ||
            action == Intent.ACTION_MY_PACKAGE_REPLACED
        ) {
            rescheduleAllAlarms(context, action)
        }
    }

    private fun rescheduleAllAlarms(context: Context, action: String?) {
        Thread {
            var db: SQLiteDatabase? = null
            try {
                val dbFile = context.getDatabasePath("dayora.db")
                if (!dbFile.exists()) {
                    Log.d(TAG, "dayora.db does not exist yet; skipping boot rescheduling.")
                    return@Thread
                }

                db = SQLiteDatabase.openDatabase(
                    dbFile.absolutePath,
                    null,
                    SQLiteDatabase.OPEN_READONLY
                )

                val nowMs = System.currentTimeMillis()
                val cursor = db.rawQuery(
                    """
                    SELECT id, notification_code, channel_id, title, body,
                           trigger_time_ms, type, reference_id, payload_json
                    FROM scheduled_notifications
                    WHERE status = 'scheduled' AND trigger_time_ms > ?
                    """.trimIndent(),
                    arrayOf(nowMs.toString())
                )

                val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
                if (alarmManager == null) {
                    Log.e(TAG, "AlarmManager service unavailable")
                    cursor.close()
                    return@Thread
                }

                var count = 0
                cursor.use {
                    while (it.moveToNext()) {
                        val code = it.getInt(it.getColumnIndexOrThrow("notification_code"))
                        val channelId = it.getString(it.getColumnIndexOrThrow("channel_id"))
                        val title = it.getString(it.getColumnIndexOrThrow("title"))
                        val body = it.getString(it.getColumnIndexOrThrow("body"))
                        val triggerMs = it.getLong(it.getColumnIndexOrThrow("trigger_time_ms"))
                        val type = it.getString(it.getColumnIndexOrThrow("type"))
                        val referenceId = it.getString(it.getColumnIndexOrThrow("reference_id"))
                        val payloadJson = it.getString(it.getColumnIndexOrThrow("payload_json"))

                        val alarmIntent = Intent(context, DayoraAlarmReceiver::class.java).apply {
                            putExtra("code", code)
                            putExtra("channel_id", channelId)
                            putExtra("title", title)
                            putExtra("body", body)
                            putExtra("type", type)
                            putExtra("reference_id", referenceId)
                            putExtra("payload_json", payloadJson)
                        }

                        val pendingIntent = PendingIntent.getBroadcast(
                            context,
                            code,
                            alarmIntent,
                            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                        )

                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
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
                        count++
                    }
                }
                Log.d(TAG, "Successfully restored $count scheduled alarms after $action")
            } catch (e: Exception) {
                Log.e(TAG, "Error restoring alarms in DayoraBootReceiver", e)
            } finally {
                try {
                    db?.close()
                } catch (ignored: Exception) {}
            }
        }.start()
    }

    companion object {
        private const val TAG = "DayoraBootReceiver"
    }
}
