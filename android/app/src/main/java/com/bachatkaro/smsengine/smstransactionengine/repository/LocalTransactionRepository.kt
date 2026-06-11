package com.bachatkaro.smsengine.smstransactionengine.repository

import android.content.Context
import com.bachatkaro.smsengine.smstransactionengine.database.TransactionDao
import com.bachatkaro.smsengine.smstransactionengine.model.Transaction
import com.bachatkaro.smsengine.smstransactionengine.model.TransactionType

class LocalTransactionRepository(context: Context) : TransactionRepository {

    private val dao = TransactionDao(context.applicationContext)

    // TODO: Replace with RemoteTransactionRepository (API) in future

    override fun insert(transaction: Transaction): Long = dao.insertAtomic(transaction)

    override fun getAll(limit: Int, userId: String?): List<Transaction> = dao.getAll(limit, userId)

    override fun isDuplicate(hash: String): Boolean = dao.isDuplicate(hash)

    override fun isReferenceDuplicate(reference: String): Boolean = dao.isReferenceDuplicate(reference)

    override fun getByType(type: TransactionType, userId: String?): List<Transaction> = dao.getByType(type, userId)

    override fun getByDateRange(from: Long, to: Long, userId: String?): List<Transaction> = dao.getByDateRange(from, to, userId)

    override fun count(userId: String?): Long = dao.count(userId)

    override fun totalDebits(userId: String?): Long = dao.totalDebits(userId)

    override fun totalCredits(userId: String?): Long = dao.totalCredits(userId)

    override fun deleteAll(): Int = dao.deleteAll()
}
