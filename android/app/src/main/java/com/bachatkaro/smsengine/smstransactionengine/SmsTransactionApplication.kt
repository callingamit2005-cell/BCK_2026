package com.bachatkaro.smsengine.smstransactionengine

import android.app.Application
import com.bachatkaro.smsengine.smstransactionengine.reliability.SmsRecoveryScheduler
import com.bachatkaro.smsengine.smstransactionengine.sync.TransactionSyncScheduler
import com.bachatkaro.smsengine.smstransactionengine.util.SmsEngineLogger

class SmsTransactionApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        SmsEngineLogger.init(this)
        SmsRecoveryScheduler.schedule(this)
        TransactionSyncScheduler.schedulePeriodic(this)
        TransactionSyncScheduler.triggerImmediate(this)
    }
}
