package com.bachatkaro.smsengine.smstransactionengine.reliability

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings

object OemPowerHelper {

    fun isBatteryOptimizationActive(context: Context): Boolean {
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
            ?: return false
        return !powerManager.isIgnoringBatteryOptimizations(context.packageName)
    }

    fun buildGuidanceMessage(): String {
        return guidanceForManufacturer(Build.MANUFACTURER)
    }

    fun guidanceForManufacturer(manufacturer: String): String {
        return when (manufacturer.lowercase()) {
            "xiaomi" -> "Battery optimization is active. On MIUI, also enable AutoStart and allow the app to run in background."
            "oppo" -> "Battery optimization is active. On Oppo/ColorOS, allow background activity and lock the app in recents."
            "vivo" -> "Battery optimization is active. On Vivo, allow background activity and disable app sleep restrictions."
            "samsung" -> "Battery optimization is active. On Samsung, set battery usage to Unrestricted for this app."
            "nothing" -> "Battery optimization is active. Set battery usage to Unrestricted for this app."
            else -> "Battery optimization is active. Please allow unrestricted battery/background activity for reliable SMS processing."
        }
    }

    fun buildOptimizationIntent(context: Context): Intent {
        return Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
            data = Uri.parse("package:${context.packageName}")
        }
    }

    fun buildFallbackIntent(): Intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
}
