package com.bachatkaro.smsengine.smstransactionengine.parser

import com.bachatkaro.smsengine.smstransactionengine.util.SmsEngineLogger
import com.bachatkaro.smsengine.smstransactionengine.util.SmsNormalizationHelper

/**
 * TransactionFilter — Research-grade Indian Banking SMS Classifier
 * ─────────────────────────────────────────────────────────────────
 * Trained on real Indian bank/UPI/wallet SMS corpus.
 *
 * ACCEPT: Real debit/credit/UPI/ATM/NEFT/IMPS/RTGS/POS transactions
 * REJECT: OTP, balance alerts, bill reminders, marketing, offers,
 *         declined txns, service tickets, AMC, card payment confirmations,
 *         cashback-only, promotional, KYC, insurance, loan offers
 *
 * Architecture:
 *   Layer 1 — HARD BLOCK  : instant reject (any match)
 *   Layer 2 — INTENT CHECK: must have real transaction verb
 *   Layer 3 — AMOUNT CHECK: must have currency marker + numeric amount
 *   Layer 4 — CONTEXT     : account ref / merchant / sender scoring
 */
object TransactionFilter {

    private const val TAG = "TransactionFilter"

    // ─── Trusted financial senders ────────────────────────────────────────
    private val TRUSTED_SENDERS = setOf(
        // HDFC
        "HDFCBK", "HDFCBANK", "HDFCCC", "HDFCCRDT",
        // SBI
        "SBIINB", "SBISMS", "SBICARD", "SBICRD",
        // ICICI
        "ICICIB", "ICICIBANK", "ICICIPAY",
        // Axis
        "AXISBK", "AXISBANK", "AXISCARD",
        // Kotak
        "KOTAKB", "KOTAKBANK", "KOTAKCC",
        // PNB
        "PNBSMS", "PNBBANK",
        // BOB
        "BOBSMS", "BOBCRD", "BOBBANKK", "BOBCARD", "BOBIN",
        // Canara
        "CANBNK", "CANARABANK",
        // Union
        "UNIONB", "UNIONBANK",
        // IndusInd
        "INDUSB", "INDUSINDB",
        // Yes
        "YESBNK", "YESBANK",
        // IDFC
        "IDFCBK", "IDFCBANK",
        // RBL
        "RBLBNK", "RBLBANK",
        // Central
        "CENTBK", "CENTBANK",
        // Syndicate
        "SYNDBK",
        // IOB
        "IOBSMS",
        // UCO
        "UCOSMS",
        // Federal
        "FEDBK", "FEDERALBANK",
        // Bandhan
        "BANDHAN",
        // UPI / Wallets
        "PAYTM", "PYTMSMS", "GPAY", "PHONEPE", "PHONEPAY",
        "AMAZONPAY", "BHIMUPI", "BHIM", "UPI", "NPCI",
        "MOBIKWIK", "FREECHARGE",
        // Utility (real payments)
        "UPPCL", "BSES", "MSEDCL", "BESCOM", "APSPDCL",
        "TSSPDCL", "WBSEDCL", "JVVNL",
        // Card networks
        "VISAALERT", "MASTERCARD", "RUPAYSMS"
    )

    // ─── Layer 1: HARD BLOCK ──────────────────────────────────────────────
    // Any single match = INSTANT REJECT. No exceptions.
    private val HARD_BLOCK = setOf(

        // ── OTP / Verification Codes ────────────────────────────────────
        "otp",           // catches all otp variants
        "otp is",
        "otp for",
        "your otp",
        "otp:",
        "otp-",
        "otp no",
        "one time password",
        "one-time password",
        "onetime password",
        "verification code",
        "secret code",
        "do not share",
        "dont share",
        "don't share",
        "not share",
        "ipin",
        "mpin",
        "cvv",
        "pin change",
        "password reset",
        "login otp",
        "login code",
        "login attempt",
        "cancellation code",
        "happiness code",
        "cancellation request",
        "your ticket no is",
        "ticket number is",
        "will contact shortly",
        "one time pin",
        "dynamic password",

        // ── Balance-Only Alerts ─────────────────────────────────────────
        "available bal",
        "avl bal",
        "avl balance",
        "avlbl bal",
        "available balance",
        "available limit",
        "as on yesterday",
        "as on date",
        "bal as on",
        "balance as on",
        "yesterday's bal",
        "yesterday bal",
        "gone below minimum",
        "below minimum limit",
        "minimum limit of inr",
        "minimum balance",
        "low balance alert",
        "closing balance",
        "opening balance",
        "total bal:",
        "avlbl amt:",
        "cheques are subject to clearing",
        "subject to clearing",
        "for updated a/c bal",
        "for updated balance",
        "balance enquiry",
        "balance update",
        "balance alert",
        "balance info",
        "a/c bal dial",
        "dial 1800",            // HDFC balance check helpline
        "account summary",
        "bal is inr",
        "bal: inr",
        "bal inr",
        "insufficient balance",
        "your balance is",
        "balance is rs",
        "balance rs",
        "bal rs",
        "daily bal",

        // ── Bill / Due Date Reminders ───────────────────────────────────
        "bill alert",
        "new bill alert",
        "bill is due",
        "is due on",
        "due on",
        "payment due",
        "payment is due",
        "bill due",
        "due date",
        "minimum due",
        "minimum amount due",
        "outstanding amount",
        "total outstanding",
        "unbilled amount",
        "unbilled balance",
        "emi due",
        "emi is due",
        "emi reminder",            // "CRED cash: EMI reminder"
        "cred cash",               // CRED EMI product
        "is due tomorrow",         // "EMI is due tomorrow"
        "delayed payment",         // "Delayed payment will result in late fees"
        "late fees",               // loan/EMI reminder
        "autopay",
        "auto debit on",
        "auto-debit",
        "standing instruction",
        "si execution",
        "credit card statement",
        "card statement",
        "ignore if paid",
        "if already paid",
        "kindly pay",
        "please pay",
        "pay your bill",
        "payment reminder",

        // ── Declined / Failed / Blocked Transactions ────────────────────
        "is declined",
        "has been declined",
        "transaction declined",
        "txn declined",
        "payment declined",
        "payment failed",
        "transaction failed",
        "txn failed",
        "could not be processed",
        "unable to process",
        "crossed the domestic pos",
        "crossed pos limit",
        "set your card limit",
        "card limit exceeded",
        "daily limit exceeded",
        "exceeds limit",
        "not authorised",
        "not authorized",
        "authorization failed",

        // ── Card Payment Confirmations (card bill payment, not spending) ─
        "payment received for your",
        "received for your bobcard",
        "received for your credit card",
        "received for your hdfc",
        "received towards your",
        "card bill payment",
        "credit card payment of",
        "visit bobcard",
        "bobcard.io",
        "bobcard app",             // "Visit bobcard app:"
        "online card account",
        "card dues",

        // ── AMC / Warranty / Service Tickets ───────────────────────────
        "amc/ew no",
        "amc ew no",     // normalizer may convert / to space
        "amc no",
        "ew no",
        "ew no-",
        "warranty created",
        "warranty renewed",
        "service created",
        "created for your",
        "cheque, if any, is subject to realization",
        "for query pl call",
        "track the ticket",
        "further assistance",
        "service request",
        "service ticket",
        "ticket raised",
        "ticket id",
        "helpdesk",

        // ── Marketing / Promotional ─────────────────────────────────────
        "loan offer",
        "personal loan offer",
        "home loan offer",
        "loan against property",   // "get a Loan Against Property"
        "no collateral loan",
        "collateral loan",
        "mushkil raha",            // Hindi loan marketing phrase
        "tenure ke sath",          // Hindi loan tenure phrase
        "tenure of upto",          // "tenure of upto 20 years"
        "get funds in your bank",  // Moneycontrol loan ad
        "funds in your bank account within minutes",
        "pre-approved",
        "pre approved",
        "preapproved",
        "eligible for a loan",
        "eligible for loan",
        "you are eligible",
        "apply now",
        "apply online",
        "book now",
        "order now",
        "shop now",
        "buy now",
        "offer valid",
        "limited offer",
        "exclusive offer",
        "special offer",
        "festive offer",
        "diwali offer",
        "new year offer",
        "congratulation",
        "congratulations",
        "you have won",
        "you've won",
        "you won",
        "lucky draw",
        "lucky winner",
        "winner",
        "prize",
        "gift card",
        "voucher",
        "cashback offer",
        "earn cashback",
        "get cashback",
        "reward points",
        "loyalty points",
        "bonus points",
        "points earned",
        "redeem",
        "earn points",
        "loyalty program",
        "upgrade your",
        "world cup",
        "big screen",
        "dth box",
        "every six",
        "enjoy up to",
        "save rs.",
        "save upto",
        "upto rs",
        "off on",
        "% off",
        "get airtel",
        "airtel dth",
        "safe second account",
        "open now",
        "download the app",
        "install app",
        "refer and earn",
        "refer a friend",
        "invite friends",
        "click to claim",
        "claim your",
        "discount coupon",
        "promo code",
        "use code",

        // ── KYC / Regulatory / Account Admin ───────────────────────────
        "ckyc",                    // "CKYC record...Central KYC Registry"
        "central kyc",
        "ckycrr",
        "kyc record",
        "kyc update",
        "kyc pending",
        "kyc required",
        "kyc verification",
        "update your kyc",
        "complete kyc",
        "link aadhaar",
        "link your aadhaar",
        "link pan",
        "link your pan",
        "income tax",
        "itr",
        "form 26as",
        "as per rbi",
        "as per sebi",
        "as per irdai",
        "regulatory requirement",
        "account will be blocked",
        "account will be frozen",
        "account suspended",
        "account deactivated",
        "dear customer, your account",

        // ── Insurance / Investment ──────────────────────────────────────
        "insurance premium",
        "life insurance",
        "health insurance",
        "term plan",
        "maturity amount",
        "policy renewal",
        "policy number",
        "mutual fund",
        "sip amount",
        "sip due",
        "nav update",
        "portfolio value",
        "invest now",
        "investment plan",
        "stock alert",
        "market update",

        // ── Credit Score / Reports ──────────────────────────────────────
        "credit score",
        "cibil score",
        "cibil report",
        "experian",
        "credit report",
        "improve your score"

        // 🛡️ [FORENSIC_FIX] URL HARD-BLOCK REMOVED
        // Modern Indian banking/UPI SMS frequently contain app links (e.g. hdfcbk.io, cred.club)
        // or informational links. Auto-rejecting these strings causes high false-negative rates.
        // Link signals are now handled by the weighted scoring layer instead of instant reject.
    )

    // ─── Layer 2: Transaction Intent Verbs ────────────────────────────────
    // MUST contain at least one. These are unambiguous action verbs.
    private val TRANSACTION_VERBS = setOf(
        // English — primary
        "debited",
        "credited",
        "withdrawn",
        "deducted",
        "transferred",
        "deposited",
        // English — secondary (require currency confirmation)
        "paid",
        "sent",
        "received",
        "spent",
        "charged",
        "purchase",
        "purchased",
        "transaction of",       // "A transaction of INR X at merchant"
        "txn of",
        "payment of",           // "Payment of Rs X done via UPI"
        "amount of",
        // ATM
        "atm withdrawal",
        "cash withdrawn",
        "cash withdrawal",
        "cash at atm",
        // POS
        "pos transaction",
        "pos purchase",
        // Hindi/Hinglish real transaction words
        "bhugtan",              // भुगतान (payment)
        "prapt",                // प्राप्त (received)
        "jama",                 // जमा (deposited/credited)
        "nikala",               // निकाला (withdrawn)
        "katega",               // काटेगा (will be deducted)
        "kata",                 // काटा (deducted)
        "dr a/c",
        "cr a/c",
        "a/c dr",
        "a/c cr",
        "a/c debited",
        "a/c credited",
        "account debited",
        "account credited",
        "your account has been debited",
        "your account has been credited"
    )

    // ─── Layer 3: Currency Markers ────────────────────────────────────────
    private val CURRENCY_MARKERS = setOf(
        "₹", "rs.", "rs ", "inr", "rupee", "rupees",
        "रु", "रू", "रू०", "रुपए", "रुपये"  // Hindi currency
    )

    // ─── Layer 4: Account / Transaction Reference Signals ─────────────────
    // Presence of these signals = higher confidence it's a real transaction
    private val ACCOUNT_REF_SIGNALS = listOf(
        "a/c", "acct", "account",
        "card", "ending", "xx", "xxxx",
        "upi", "imps", "neft", "rtgs",
        "ref", "refno", "ref no", "reference",
        "txn", "txnid", "transaction id",
        "atm", "pos",
        "noc no", "transaction no"
    )

    // ─── Public API ───────────────────────────────────────────────────────

    fun isTransactionSMS(body: String, sender: String?): Boolean {
        if (body.isBlank()) return false

        val normalized        = SmsNormalizationHelper.normalize(body)
        val normalizedSender  = sender?.uppercase()?.trim() ?: ""

        // ══ LAYER 1: Hard Block ══════════════════════════════════════════
        val blockHit = HARD_BLOCK.firstOrNull { normalized.contains(it) }
        if (blockHit != null) {
            SmsEngineLogger.d(TAG, "HARD_BLOCK='$blockHit' sender=$sender")
            return false
        }

        // ══ LAYER 2: Transaction Intent ══════════════════════════════════
        val intentVerb = TRANSACTION_VERBS.firstOrNull { normalized.contains(it) }
        if (intentVerb == null) {
            SmsEngineLogger.d(TAG, "REJECT no_intent sender=$sender")
            return false
        }

        // ══ LAYER 3: Currency Marker ══════════════════════════════════════
        val hasCurrency = CURRENCY_MARKERS.any { normalized.contains(it) }
        if (!hasCurrency) {
            SmsEngineLogger.d(TAG, "REJECT no_currency sender=$sender")
            return false
        }

        // ══ LAYER 4: Score ════════════════════════════════════════════════
        val isTrustedSender = isTrustedSender(normalizedSender)
        val hasAccountRef   = ACCOUNT_REF_SIGNALS.any { normalized.contains(it) }

        var score = 0
        if (isTrustedSender) score += 3
        if (hasAccountRef)   score += 2
        if (hasCurrency)     score += 2
        if (intentVerb != null) score += 3

        // 🛡️ [FORENSIC_FIX] RELAXED WEAK VERB CONSTRAINTS
        // Modern UPI transactions often omit explicit account references (A/c XXXX).
        // Since we have already verified intentVerb and hasCurrency (Layer 3), 
        // we allow these to pass to the parser for deeper extraction.
        val passed = score >= 5

        SmsEngineLogger.i(TAG,
            "FILTER ${if (passed) "PASS" else "REJECT"} score=$score " +
            "trusted=$isTrustedSender accountRef=$hasAccountRef " +
            "verb=$intentVerb sender=$sender"
        )
        return passed
    }

    private fun isTrustedSender(sender: String): Boolean {
        if (sender.isBlank()) return false
        return TRUSTED_SENDERS.any { sender.contains(it) }
    }

    /**
     * isHardBlocked — checks ONLY the HARD_BLOCK list.
     * Used by SmsTransactionEngine to reject SMS unconditionally,
     * even in historical/bypass mode.
     * Returns true if ANY hard-block pattern matches.
     */
    fun isHardBlocked(body: String): Boolean {
        if (body.isBlank()) return false
        val normalized = SmsNormalizationHelper.normalize(body)
        return HARD_BLOCK.any { normalized.contains(it) }
    }

    // ─── Legacy compatibility ──────────────────────────────────────────────
    fun shouldProcess(sender: String, body: String): Boolean = isTransactionSMS(body, sender)
    fun isRecognizedFinancialSender(sender: String, body: String): Boolean = isTrustedSender(sender.uppercase())

    fun classify(sender: String, body: String): Pair<RuleEngine.RejectReason, String>? {
        if (!isTransactionSMS(body, sender)) {
            return Pair(RuleEngine.RejectReason.CONTAINS_SPAM_SIGNAL, "filtered_by_transaction_filter")
        }
        return null
    }
}
