package com.bachatkaro.app

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import android.util.Log
import android.webkit.WebView
import android.webkit.WebViewRenderProcess
import android.webkit.WebViewRenderProcessClient
import android.content.Context
import android.os.Build
import java.util.UUID
import com.bachatkaro.SmsBridge
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {

    private companion object {
        const val TAG = "[PROCESS_FORENSICS]"
        const val PREFS_NAME = "BachatKaroForensics"
        const val KEY_LAUNCH_COUNT = "native_launch_count"
        const val APP_PERMISSIONS_REQUEST_CODE = 1001
        
        fun getRequiredPermissions(): Array<String> {
            val permissions = mutableListOf(
                Manifest.permission.RECEIVE_SMS,
                Manifest.permission.READ_SMS,
                Manifest.permission.RECORD_AUDIO
            )
            
            // NOTIFICATION_API_GUARD: Only request for Android 13+
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                permissions.add(Manifest.permission.POST_NOTIFICATIONS)
            }
            
            return permissions.toTypedArray()
        }
    }

    private val processInstanceId = UUID.randomUUID().toString().substring(0, 8).uppercase()

    override fun onCreate(savedInstanceState: Bundle?) {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val launchCount = prefs.getInt(KEY_LAUNCH_COUNT, 0) + 1
        prefs.edit().putInt(KEY_LAUNCH_COUNT, launchCount).apply()

        Log.d(TAG, "[ON_CREATE] instance: $processInstanceId, launchCount: $launchCount, recreated: ${savedInstanceState != null}, timestamp: ${System.currentTimeMillis()}")
        
        // 🕵️ GLOBAL UNCAUGHT EXCEPTION HANDLER
        val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            Log.e(TAG, "[FATAL_NATIVE_CRASH] instance: $processInstanceId, thread: ${thread.name}, class: ${throwable.javaClass.simpleName}, message: ${throwable.message}")
            Log.e(TAG, "[FATAL_NATIVE_STACK] ${Log.getStackTraceString(throwable)}")
            defaultHandler?.uncaughtException(thread, throwable)
        }

        registerPlugin(SmsBridge::class.java)
        super.onCreate(savedInstanceState)
        
        // 🕵️ WEBVIEW RENDERER CRASH DETECTION
        // SAFE_API_GUARD: WebViewRenderProcessClient requires API 29+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            try {
                this.bridge?.webView?.let { webView ->
                    webView.webViewRenderProcessClient = object : WebViewRenderProcessClient() {
                        override fun onRenderProcessUnresponsive(view: WebView, renderer: WebViewRenderProcess?) {
                            Log.w(TAG, "[RENDERER_UNRESPONSIVE] instance: $processInstanceId")
                        }

                        override fun onRenderProcessResponsive(view: WebView, renderer: WebViewRenderProcess?) {
                            Log.i(TAG, "[RENDERER_RESPONSIVE] instance: $processInstanceId")
                        }
                    }
                    Log.d(TAG, "[RENDERER_CLIENT_ATTACHED]")
                }
            } catch (e: Exception) {
                Log.e(TAG, "[RENDERER_CLIENT_FAIL] error: ${e.message}")
            }
        }

        requestRuntimePermissionsIfNeeded()
    }

    override fun onStart() {
        super.onStart()
        Log.d(TAG, "[ON_START] instance: $processInstanceId, timestamp: ${System.currentTimeMillis()}")
    }

    override fun onResume() {
        super.onResume()
        Log.d(TAG, "[ON_RESUME] instance: $processInstanceId, timestamp: ${System.currentTimeMillis()}")
    }

    override fun onPause() {
        super.onPause()
        Log.d(TAG, "[ON_PAUSE] instance: $processInstanceId, timestamp: ${System.currentTimeMillis()}")
    }

    override fun onStop() {
        super.onStop()
        Log.d(TAG, "[ON_STOP] instance: $processInstanceId, timestamp: ${System.currentTimeMillis()}")
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "[ON_DESTROY] instance: $processInstanceId, timestamp: ${System.currentTimeMillis()}")
    }

    override fun onTrimMemory(level: Int) {
        super.onTrimMemory(level)
        Log.d(TAG, "[ON_TRIM_MEMORY] instance: $processInstanceId, level: $level, timestamp: ${System.currentTimeMillis()}")
    }

    override fun onLowMemory() {
        super.onLowMemory()
        Log.d(TAG, "[ON_LOW_MEMORY] instance: $processInstanceId, timestamp: ${System.currentTimeMillis()}")
    }

    private fun requestRuntimePermissionsIfNeeded() {
        val required = getRequiredPermissions()
        val missingPermissions = required.filter { permission ->
            ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED
        }

        if (missingPermissions.isNotEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                missingPermissions.toTypedArray(),
                APP_PERMISSIONS_REQUEST_CODE,
            )
        }
    }
}
