package com.bachatkaro.smsengine.smstransactionengine.sync

import android.content.Context

object SyncSessionStore {

    private const val PREFS_NAME = "sync_session"
    private const val KEY_USER_ID = "userId"
    private const val KEY_ACCESS_TOKEN = "token"
    private const val KEY_REFRESH_TOKEN = "refreshToken"
    private const val KEY_EXPIRES_AT = "expiresAt"

    data class SessionData(
        val userId: String,
        val accessToken: String,
        val refreshToken: String = "",
        val expiresAtEpochSeconds: Long = 0L
    )

    @JvmStatic
    fun save(context: Context, userId: String, token: String) {
        context.applicationContext
            .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_USER_ID, userId)
            .putString(KEY_ACCESS_TOKEN, token)
            .apply()
    }

    @JvmStatic
    fun save(context: Context, session: SessionData) {
        context.applicationContext
            .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_USER_ID, session.userId)
            .putString(KEY_ACCESS_TOKEN, session.accessToken)
            .putString(KEY_REFRESH_TOKEN, session.refreshToken)
            .putLong(KEY_EXPIRES_AT, session.expiresAtEpochSeconds)
            .apply()
    }

    @JvmStatic
    fun load(context: Context): SessionData? {
        val prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val userId = prefs.getString(KEY_USER_ID, null) ?: return null
        val accessToken = prefs.getString(KEY_ACCESS_TOKEN, null) ?: return null
        val refreshToken = prefs.getString(KEY_REFRESH_TOKEN, "") ?: ""
        val expiresAt = prefs.getLong(KEY_EXPIRES_AT, 0L)
        return SessionData(userId, accessToken, refreshToken, expiresAt)
    }

    @JvmStatic
    fun clear(context: Context) {
        context.applicationContext
            .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .clear()
            .apply()
    }
}
