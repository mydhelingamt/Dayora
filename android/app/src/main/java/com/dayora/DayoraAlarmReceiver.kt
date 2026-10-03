package com.dayora

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

/**
 * BroadcastReceiver responsible for firing Dayora notifications when AlarmManager alarms trigger.
 * Handles both birthday celebrations and task reminders, with deep linking into MainActivity.
 */
class DayoraAlarmReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        try {
            val code = intent.getIntExtra("code", 0)
            val channelId = intent.getStringExtra("channel_id") ?: CHANNEL_BIRTHDAYS
            val title = intent.getStringExtra("title") ?: "Dayora Reminder"
            val body = intent.getStringExtra("body") ?: ""
            val type = intent.getStringExtra("type") ?: "general"
            val referenceId = intent.getStringExtra("reference_id") ?: ""
            val payloadJson = intent.getStringExtra("payload_json") ?: ""

            Log.d(TAG, "DayoraAlarmReceiver triggered: code=$code, type=$type, title=$title")

            ensureNotificationChannels(context)

            // Intent to open MainActivity on notification tap
            val contentIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra("is_from_notification", true)
                putExtra("notification_type", type)
                putExtra("reference_id", referenceId)
                putExtra("payload_json", payloadJson)
                putExtra("notification_code", code)
            }

            val pendingIntent = PendingIntent.getActivity(
                context,
                code,
                contentIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            // Use launcher icon as small icon
            val smallIconRes = context.applicationInfo.icon.takeIf { it != 0 } ?: android.R.drawable.ic_dialog_info

            val notification = NotificationCompat.Builder(context, channelId)
                .setSmallIcon(smallIconRes)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setColor(android.graphics.Color.parseColor("#6366F1"))
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .build()

            NotificationManagerCompat.from(context).notify(code, notification)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to deliver notification in DayoraAlarmReceiver", e)
        }
    }

    companion object {
        private const val TAG = "DayoraAlarmReceiver"
        const val CHANNEL_BIRTHDAYS = "dayora_birthdays"
        const val CHANNEL_TASKS = "dayora_tasks"

        fun ensureNotificationChannels(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

                val birthdayChannel = NotificationChannel(
                    CHANNEL_BIRTHDAYS,
                    "Birthday Reminders",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Notifications for upcoming birthdays and milestone celebrations"
                    enableVibration(true)
                    enableLights(true)
                    lightColor = android.graphics.Color.parseColor("#6366F1")
                    vibrationPattern = longArrayOf(0, 250, 250, 250)
                    lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
                    setShowBadge(true)
                }

                val taskChannel = NotificationChannel(
                    CHANNEL_TASKS,
                    "Task Deadlines",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Alerts for scheduled tasks and upcoming due dates"
                    enableVibration(true)
                    enableLights(true)
                    lightColor = android.graphics.Color.parseColor("#6366F1")
                    vibrationPattern = longArrayOf(0, 250, 250, 250)
                    lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
                    setShowBadge(true)
                }

                notificationManager.createNotificationChannel(birthdayChannel)
                notificationManager.createNotificationChannel(taskChannel)
            }
        }
    }
}
