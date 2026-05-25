package com.bachatkaro.smsengine.smstransactionengine.receiver

import android.content.Intent
import android.provider.Telephony
import android.telephony.SmsMessage
import com.bachatkaro.smsengine.smstransactionengine.util.SmsEngineLogger

/**
 * SmsAssembler
 * ────────────
 * Correctly groups and orders multi-part (concatenated) SMS PDUs before
 * the engine processes them.
 *
 * WHY THIS EXISTS — The original code had two bugs:
 *
 *   Bug 1 — Wrong ordering:
 *     parts.joinToString("") { it.messageBody ?: "" }
 *     The PDUs in a broadcast intent arrive in network delivery order, not
 *     necessarily in the sequence number order defined by the UDH header.
 *     On some carrier configurations (especially routed via aggregators
 *     in India — Airtel, Jio, Vi), parts 2 and 3 can precede part 1.
 *
 *   Bug 2 — Wrong grouping:
 *     groupBy { it.originatingAddress ?: "UNKNOWN" }
 *     If two large SMS from the same sender arrive within the same broadcast
 *     (possible when the telephony layer batches delivery), their parts get
 *     mixed into one body string.  This is rare but produces completely wrong
 *     transaction bodies.
 *
 * FIX — Parse the User Data Header (UDH) from each raw PDU byte array to
 * extract the concatenation reference number and part sequence number.
 * Group by (sender + referenceNumber), sort parts by sequence number,
 * then concatenate.  Falls back to broadcast-order concatenation for
 * single-part messages or if UDH parsing fails.
 *
 * PDU FORMAT (SMS-DELIVER, 3GPP TS 23.040):
 *   [SMSC len 1B] [SMSC addr N]
 *   [MTI/flags 1B]              ← bit 6 = UDHI (UDH present)
 *   [OA len 1B] [OA type 1B] [OA addr ceil(OA_len/2) B]
 *   [PID 1B] [DCS 1B] [SCTS 7B] [UDL 1B]
 *   [UD …]                      ← if UDHI, first byte is UDH length
 *
 * UDH Concatenation IEs:
 *   IE 0x00 (8-bit ref):  length=3  [ref 1B] [total 1B] [seq 1B]
 *   IE 0x08 (16-bit ref): length=4  [ref_hi 1B] [ref_lo 1B] [total 1B] [seq 1B]
 */
object SmsAssembler {

    private const val TAG = "SmsAssembler"

    /** Represents a fully assembled, possibly multi-part SMS. */
    data class AssembledSms(
        val sender:    String,
        val body:      String,
        val timestamp: Long,
        val partCount: Int
    )

    // ─── Public API ───────────────────────────────────────────────────────

    /**
     * Extract, group, sort, and concatenate all SMS messages contained in
     * an [Intent] with action [Telephony.Sms.Intents.SMS_RECEIVED_ACTION].
     *
     * @return One [AssembledSms] per logical message (a multi-part SMS
     *         counts as one entry regardless of how many PDUs it has).
     */
    fun fromIntent(intent: Intent): List<AssembledSms> {
        // Pull the raw PDU byte arrays and format string from the intent bundle.
        // "format" is "3gpp" (GSM) or "3gpp2" (CDMA).
        val rawPdus = try {
            @Suppress("UNCHECKED_CAST")
            intent.extras?.get("pdus") as? Array<ByteArray>
                ?: (intent.extras?.get("pdus") as? Array<*>)
                    ?.filterIsInstance<ByteArray>()?.toTypedArray()
        } catch (ex: Exception) {
            SmsEngineLogger.w(TAG, "Could not read raw PDUs from intent: ${ex.message}")
            null
        }

        if (rawPdus.isNullOrEmpty()) {
            SmsEngineLogger.w(TAG, "No raw PDUs — falling back to getMessagesFromIntent()")
            return fallbackFromIntent(intent)
        }

        val format = intent.getStringExtra("format") ?: "3gpp"
        return assemblePdus(rawPdus, format)
    }

    // ─── Core assembly ────────────────────────────────────────────────────

    private fun assemblePdus(rawPdus: Array<ByteArray>, format: String): List<AssembledSms> {
        data class PduRecord(
            val sender:     String,
            val body:       String,
            val timestamp:  Long,
            val groupKey:   String,   // "${sender}::${concatRef}" — groups parts of same message
            val seqIndex:   Int       // 1-based sequence number within the group
        )

        val records = mutableListOf<PduRecord>()

        rawPdus.forEachIndexed { pduIndex, pdu ->
            try {
                val msg = SmsMessage.createFromPdu(pdu, format) ?: run {
                    SmsEngineLogger.w(TAG, "createFromPdu returned null for PDU index $pduIndex")
                    return@forEachIndexed
                }

                val sender    = msg.originatingAddress ?: "UNKNOWN"
                val body      = msg.messageBody ?: ""
                val timestamp = msg.timestampMillis
                val concat    = parseConcatInfo(pdu)

                val (groupKey, seqIndex) = if (concat != null) {
                    val (ref, _, seq) = concat
                    // Key = sender + concat reference number to separate simultaneous multi-part
                    // messages from the same sender
                    Pair("${sender}::concat_$ref", seq)
                } else {
                    // Single-part message: use a unique key so it never merges with others
                    Pair("${sender}::single_$pduIndex", 1)
                }

                records.add(PduRecord(sender, body, timestamp, groupKey, seqIndex))

            } catch (ex: Exception) {
                SmsEngineLogger.e(TAG, "Error processing PDU index $pduIndex: ${ex.message}", ex)
            }
        }

        if (records.isEmpty()) return emptyList()

        // Group, sort by sequence number, concatenate
        return records
            .groupBy { it.groupKey }
            .mapNotNull { (_, parts) ->
                try {
                    val sorted = parts.sortedBy { it.seqIndex }
                    AssembledSms(
                        sender    = sorted.first().sender,
                        body      = sorted.joinToString("") { it.body },
                        timestamp = sorted.first().timestamp,
                        partCount = sorted.size
                    )
                } catch (ex: Exception) {
                    SmsEngineLogger.e(TAG, "Assembly failed for group: ${ex.message}", ex)
                    null
                }
            }
    }

    // ─── UDH Parser ───────────────────────────────────────────────────────

    /**
     * Parse concatenation info from raw PDU bytes.
     *
     * @return Triple(referenceNumber, totalParts, partSequence) or null if
     *         no UDH is present / UDH has no concatenation IE / parse error.
     *
     * partSequence is 1-based.  A return value of Triple(5, 3, 2) means:
     * reference=5, this SMS has 3 parts total, and this is part 2.
     */
    internal fun parseConcatInfo(pdu: ByteArray): Triple<Int, Int, Int>? {
        return try {
            var pos = 0

            // 1. Skip SMSC info block
            if (pos >= pdu.size) return null
            val smscLen = pdu[pos].toUByte().toInt()
            pos += 1 + smscLen
            if (pos >= pdu.size) return null

            // 2. MTI / first-octet flags
            //    Bit 6 (mask 0x40) = UDHI — User Data Header Indicator
            val firstOctet = pdu[pos].toUByte().toInt()
            val hasUdh = (firstOctet and 0x40) != 0
            if (!hasUdh) return null   // No header — single-part message
            pos++
            if (pos >= pdu.size) return null

            // 3. Skip Originating Address (OA)
            //    OA length is in semi-octets (nibbles); round up to bytes, +1 for TON/NPI byte
            val oaLenSemiOctets = pdu[pos].toUByte().toInt()
            val oaLenBytes = (oaLenSemiOctets + 1) / 2
            pos += 1           // skip OA length byte
            pos += 1           // skip TON/NPI byte
            pos += oaLenBytes  // skip OA digits
            if (pos >= pdu.size) return null

            // 4. Skip Protocol Identifier (PID) and Data Coding Scheme (DCS)
            pos += 2
            if (pos >= pdu.size) return null

            // 5. Skip Service Centre Time Stamp (SCTS) — always 7 bytes
            pos += 7
            if (pos >= pdu.size) return null

            // 6. Skip User Data Length (UDL) — we don't need the total UD length
            pos++
            if (pos >= pdu.size) return null

            // 7. User Data starts here.  The first byte is the UDH length (not counting itself).
            val udhLen = pdu[pos].toUByte().toInt()
            pos++
            val udhEnd = pos + udhLen
            if (udhEnd > pdu.size) return null

            // 8. Walk IEs (Information Elements) inside the UDH
            while (pos + 1 < udhEnd) {
                val iei    = pdu[pos].toUByte().toInt()
                val ieLen  = pdu[pos + 1].toUByte().toInt()
                pos += 2

                if (pos + ieLen > udhEnd) break  // Malformed IE — stop

                when (iei) {
                    // IE 0x00 — Concatenated Short Messages, 8-bit reference number
                    0x00 -> {
                        if (ieLen == 3) {
                            val ref   = pdu[pos].toUByte().toInt()
                            val total = pdu[pos + 1].toUByte().toInt()
                            val seq   = pdu[pos + 2].toUByte().toInt()
                            if (total > 0 && seq in 1..total) {
                                return Triple(ref, total, seq)
                            }
                        }
                        pos += ieLen
                    }
                    // IE 0x08 — Concatenated Short Messages, 16-bit reference number
                    0x08 -> {
                        if (ieLen == 4) {
                            val ref   = (pdu[pos].toUByte().toInt() shl 8) or
                                         pdu[pos + 1].toUByte().toInt()
                            val total = pdu[pos + 2].toUByte().toInt()
                            val seq   = pdu[pos + 3].toUByte().toInt()
                            if (total > 0 && seq in 1..total) {
                                return Triple(ref, total, seq)
                            }
                        }
                        pos += ieLen
                    }
                    else -> pos += ieLen   // Skip unrecognised IE
                }
            }
            null   // UDH present but no concat IE found
        } catch (_: Exception) {
            // Any ArrayIndexOutOfBoundsException or other error → treat as single-part
            null
        }
    }

    // ─── Fallback ─────────────────────────────────────────────────────────

    /**
     * Fallback path when raw PDUs are not accessible.
     * Uses the framework's [Telephony.Sms.Intents.getMessagesFromIntent] which returns
     * PDUs in the order supplied by the telephony stack — correct in most cases.
     */
    private fun fallbackFromIntent(intent: Intent): List<AssembledSms> {
        return try {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
                ?: return emptyList()

            messages
                .groupBy { it.originatingAddress ?: "UNKNOWN" }
                .map { (sender, parts) ->
                    AssembledSms(
                        sender    = sender,
                        body      = parts.joinToString("") { it.messageBody ?: "" },
                        timestamp = parts.first().timestampMillis,
                        partCount = parts.size
                    )
                }
        } catch (ex: Exception) {
            SmsEngineLogger.e(TAG, "Fallback assembly failed: ${ex.message}", ex)
            emptyList()
        }
    }
}
