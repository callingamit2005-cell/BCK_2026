package com.bachatkaro.smsengine.smstransactionengine.database

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import com.bachatkaro.smsengine.smstransactionengine.util.SmsEngineLogger

class TransactionDbHelper(context: Context) :
    SQLiteOpenHelper(context, DATABASE_NAME, null, DATABASE_VERSION) {

    companion object {
        const val DATABASE_NAME = "sms_transactions.db"
        const val DATABASE_VERSION = 9

        const val TABLE_TRANSACTIONS = "transactions"

        const val COL_ID = "_id"
        const val COL_SMS_HASH = "sms_hash"
        const val COL_SENDER = "sender"
        const val COL_RAW_BODY = "raw_body"
        const val COL_TYPE = "type"
        const val COL_AMOUNT = "amount"
        const val COL_CURRENCY = "currency"
        const val COL_ACCOUNT_REF = "account_ref"
        const val COL_REFERENCE = "reference"
        const val COL_MERCHANT = "merchant"
        const val COL_CATEGORY = "category"
        const val COL_PAYMENT_HANDLE = "payment_handle"
        const val COL_LOCATION = "location"
        const val COL_BALANCE = "balance"
        const val COL_TIMESTAMP = "timestamp"
        const val COL_PARSED_AT = "parsed_at"
        const val COL_IS_SYNCED = "is_synced"
        const val COL_SYNC_STATUS = "sync_status"
        const val COL_UPDATED_AT = "updated_at"
        const val COL_USER_ID = "user_id"
        const val COL_IS_DELETED = "is_deleted"
        const val COL_IDEMPOTENCY_KEY = "idempotency_key"
        const val COL_CANONICAL_KEY = "canonical_key"
        const val COL_IS_POSSIBLE_DUPLICATE = "is_possible_duplicate"

        private const val SQL_CREATE = """
            CREATE TABLE IF NOT EXISTS $TABLE_TRANSACTIONS (
                $COL_ID INTEGER PRIMARY KEY AUTOINCREMENT,
                $COL_SMS_HASH TEXT UNIQUE NOT NULL,
                $COL_SENDER TEXT NOT NULL DEFAULT '',
                $COL_RAW_BODY TEXT NOT NULL DEFAULT '',
                $COL_TYPE TEXT NOT NULL DEFAULT 'UNKNOWN',
                $COL_AMOUNT INTEGER NOT NULL DEFAULT 0,
                $COL_CURRENCY TEXT NOT NULL DEFAULT 'INR',
                $COL_ACCOUNT_REF TEXT NOT NULL DEFAULT '',
                $COL_REFERENCE TEXT NOT NULL DEFAULT '',
                $COL_MERCHANT TEXT NOT NULL DEFAULT '',
                $COL_CATEGORY TEXT NOT NULL DEFAULT 'Others',
                $COL_PAYMENT_HANDLE TEXT NOT NULL DEFAULT '',
                $COL_LOCATION TEXT NOT NULL DEFAULT '',
                $COL_BALANCE INTEGER NOT NULL DEFAULT -1,
                $COL_TIMESTAMP INTEGER NOT NULL DEFAULT 0,
                $COL_PARSED_AT INTEGER NOT NULL DEFAULT 0,
                $COL_IS_SYNCED INTEGER NOT NULL DEFAULT 0,
                $COL_SYNC_STATUS TEXT NOT NULL DEFAULT 'pending',
                $COL_UPDATED_AT INTEGER NOT NULL DEFAULT 0,
                $COL_USER_ID TEXT,
                $COL_IS_DELETED INTEGER NOT NULL DEFAULT 0,
                $COL_IDEMPOTENCY_KEY TEXT UNIQUE,
                $COL_CANONICAL_KEY TEXT UNIQUE,
                $COL_IS_POSSIBLE_DUPLICATE INTEGER NOT NULL DEFAULT 0
            )
        """

        private const val SQL_CREATE_INDEX = """
            CREATE UNIQUE INDEX IF NOT EXISTS idx_sms_hash
            ON $TABLE_TRANSACTIONS ($COL_SMS_HASH)
        """

        private const val SQL_CREATE_TS_INDEX = """
            CREATE INDEX IF NOT EXISTS idx_timestamp
            ON $TABLE_TRANSACTIONS ($COL_TIMESTAMP)
        """
    }

    private val TAG = "TransactionDbHelper"

    override fun onConfigure(db: SQLiteDatabase) {
        super.onConfigure(db)
        try {
            if (!db.isReadOnly) {
                db.enableWriteAheadLogging()
                db.execSQL("PRAGMA synchronous=FULL")
                db.execSQL("PRAGMA journal_mode=WAL")
            }
        } catch (ex: Exception) {
            SmsEngineLogger.w(TAG, "onConfigure failed: ${ex.message}")
        }
    }

    override fun onCreate(db: SQLiteDatabase) {
        SmsEngineLogger.i(TAG, "onCreate - creating schema v$DATABASE_VERSION")
        try {
            db.execSQL(SQL_CREATE)
            db.execSQL(SQL_CREATE_INDEX)
            db.execSQL(SQL_CREATE_TS_INDEX)
            SmsEngineLogger.i(TAG, "Schema created successfully")
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "Schema creation failed", ex)
            throw ex
        }
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        SmsEngineLogger.i(TAG, "onUpgrade v$oldVersion -> v$newVersion")
        if (oldVersion < 2) {
            try {
                db.execSQL("ALTER TABLE $TABLE_TRANSACTIONS ADD COLUMN $COL_PAYMENT_HANDLE TEXT NOT NULL DEFAULT ''")
            } catch (_: Exception) {
            }
            try {
                db.execSQL("ALTER TABLE $TABLE_TRANSACTIONS ADD COLUMN $COL_LOCATION TEXT NOT NULL DEFAULT ''")
            } catch (_: Exception) {
            }
        }
        if (oldVersion < 3) {
            try {
                db.execSQL("ALTER TABLE $TABLE_TRANSACTIONS ADD COLUMN $COL_IS_SYNCED INTEGER NOT NULL DEFAULT 0")
            } catch (_: Exception) {
            }
        }
        if (oldVersion < 4) {
            try {
                db.execSQL("ALTER TABLE $TABLE_TRANSACTIONS ADD COLUMN $COL_SYNC_STATUS TEXT NOT NULL DEFAULT 'pending'")
            } catch (_: Exception) {
            }
            try {
                db.execSQL("ALTER TABLE $TABLE_TRANSACTIONS ADD COLUMN $COL_UPDATED_AT INTEGER NOT NULL DEFAULT 0")
            } catch (_: Exception) {
            }
            // Populate sync_status from is_synced for existing records
            try {
                db.execSQL("UPDATE $TABLE_TRANSACTIONS SET $COL_SYNC_STATUS = 'completed' WHERE $COL_IS_SYNCED = 1")
            } catch (_: Exception) {
            }
        }
        if (oldVersion < 5) {
            try {
                db.execSQL("ALTER TABLE $TABLE_TRANSACTIONS ADD COLUMN $COL_USER_ID TEXT")
            } catch (_: Exception) {
            }
        }
        if (oldVersion < 6) {
            try {
                db.execSQL("ALTER TABLE $TABLE_TRANSACTIONS ADD COLUMN $COL_CATEGORY TEXT NOT NULL DEFAULT 'Others'")
            } catch (_: Exception) {
            }
        }
        if (oldVersion < 7) {
            try {
                db.execSQL("ALTER TABLE $TABLE_TRANSACTIONS ADD COLUMN $COL_IS_DELETED INTEGER NOT NULL DEFAULT 0")
            } catch (_: Exception) {
            }
        }
        if (oldVersion < 8) {
            try {
                db.execSQL("ALTER TABLE $TABLE_TRANSACTIONS ADD COLUMN $COL_IDEMPOTENCY_KEY TEXT")
            } catch (_: Exception) {
            }
            try {
                db.execSQL("ALTER TABLE $TABLE_TRANSACTIONS ADD COLUMN $COL_CANONICAL_KEY TEXT")
            } catch (_: Exception) {
            }
        }
        if (oldVersion < 9) {
            try {
                db.execSQL("ALTER TABLE $TABLE_TRANSACTIONS ADD COLUMN $COL_IS_POSSIBLE_DUPLICATE INTEGER NOT NULL DEFAULT 0")
            } catch (_: Exception) {
            }
        }
    }

    override fun onOpen(db: SQLiteDatabase) {
        super.onOpen(db)
        try {
            if (!db.isReadOnly) {
                db.execSQL("PRAGMA quick_check")
            }
        } catch (ex: Exception) {
            SmsEngineLogger.w(TAG, "quick_check failed: ${ex.message}")
        }
    }
}
