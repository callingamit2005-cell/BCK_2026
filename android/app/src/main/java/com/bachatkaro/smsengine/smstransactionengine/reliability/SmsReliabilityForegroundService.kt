package com.bachatkaro.smsengine.smstransactionengine.reliability

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.bachatkaro.app.R
import com.bachatkaro.smsengine.smstransactionengine.util.SmsEngineLogger

class SmsReliabilityForegroundService : Service() {

    private val TAG = "SmsFgService"

    override fun onCreate() {
        super.onCreate()
        try {
            createChannel()
            startForeground(NOTIFICATION_ID, buildNotification())
            SmsEngineLogger.i(TAG, "Foreground service started")
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "Failed starting foreground service: ${ex.message}", ex)
            stopSelf()
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return try {
            START_STICKY
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "onStartCommand failed", ex)
            START_NOT_STICKY
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        try {
            SmsEngineLogger.i(TAG, "Foreground service stopped")
            super.onDestroy()
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "onDestroy failed", ex)
        }
    }

    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "SMS Reliability",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(getString(R.string.app_name))
            .setContentText("SMS reliability service active")
            .setSmallIcon(android.R.drawable.stat_notify_more)
            .setOngoing(true)
            .build()
    }

    companion object {
        private const val CHANNEL_ID = "sms_reliability"
        private const val NOTIFICATION_ID = 1002

        fun start(context: Context) {
            try {
                val intent = Intent(context, SmsReliabilityForegroundService::class.java)
                ContextCompat.startForegroundService(context, intent)
            } catch (ex: Exception) {
                SmsEngineLogger.e("SmsFgService", "Unable to start foreground service: ${ex.message}", ex)
            }
        }

        fun stop(context: Context) {
            try {
                context.stopService(Intent(context, SmsReliabilityForegroundService::class.java))
            } catch (ex: Exception) {
                SmsEngineLogger.e("SmsFgService", "Unable to stop foreground service: ${ex.message}", ex)
            }
        }
    }
}
