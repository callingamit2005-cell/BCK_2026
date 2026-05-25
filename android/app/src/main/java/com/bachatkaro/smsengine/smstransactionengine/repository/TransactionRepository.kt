package com.bachatkaro.smsengine.smstransactionengine.repository

import com.bachatkaro.smsengine.smstransactionengine.model.Transaction
import com.bachatkaro.smsengine.smstransactionengine.model.TransactionType

interface TransactionRepository {
    fun insert(transaction: Transaction): Long
    fun getAll(limit: Int = 0, userId: String? = null): List<Transaction>
    fun isDuplicate(hash: String): Boolean
    fun getByType(type: TransactionType, userId: String? = null): List<Transaction>
    fun getByDateRange(from: Long, to: Long, userId: String? = null): List<Transaction>
    fun count(userId: String? = null): Long
    fun totalDebits(userId: String? = null): Long
    fun totalCredits(userId: String? = null): Long
    fun deleteAll(): Int
}
