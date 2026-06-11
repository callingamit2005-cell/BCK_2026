import { supabase } from '@/integrations/supabase/client';
import { getDB, generateIdempotencyKey } from '@/integrations/sqlite';
import { lifecycleService } from '@/services/lifecycleService';
import { PaymentTarget } from '@/components/dashboard/SmartPaySheet';
import { Capacitor } from '@capacitor/core';

/**
 * 🔒 PROTECTED FINTECH PAYMENT REGION
 * DO NOT MODIFY WITHOUT PAYMENT SYSTEM REVIEW.
 */

export type SettlementStatus = 
  | 'PENDING' 
  | 'PROCESSING' 
  | 'RETURNED'
  | 'PENDING_VERIFICATION'
  | 'USER_CONFIRMED'
  | 'SMS_VERIFIED'
  | 'ADMIN_VERIFIED'
  | 'VERIFIED' 
  | 'DISPUTED'
  | 'FAILED' 
  | 'CANCELLED'
  | 'EXPIRED'
  | 'created' | 'redirected' | 'pending_verification' | 'success' | 'failed'; // 🛡️ Legacy compatibility

export interface SettlementIntent {
  id: string;
  group_id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  currency: string;
  status: SettlementStatus;
  payment_method: string;
  idempotency_key: string;
  metadata: any;
  created_at?: string;
  updated_at?: string;
}

// 🛡️ [PHASE_3_HYBRID_MAPPING]
// Maps logical fintech states to production-locked DB ENUM values.
const DB_STATUS_MAP: Record<string, string> = {
    'PENDING': 'created',
    'PROCESSING': 'redirected',
    'RETURNED': 'pending_verification',
    'PENDING_VERIFICATION': 'pending_verification',
    'USER_CONFIRMED': 'pending_verification', // RULE 4: Maps to pending, no ledger commit
    'SMS_VERIFIED': 'success', // RULE 5: Transitions to VERIFIED (success)
    'ADMIN_VERIFIED': 'success',
    'VERIFIED': 'success',
    'DISPUTED': 'failed',
    'FAILED': 'failed',
    'CANCELLED': 'failed',
    'EXPIRED': 'failed'
};

class PaymentOrchestrator {
  private activeIntentId: string | null = null;
  private isInitialized = false;
  private isRecovering = false;
  private isProcessing = false;

  constructor() {
    // 🛡️ [PHASE_1_STABILITY] Constructor must remain side-effect free.
  }

  /**
   * 🛡️ [SMS_MATCH_ENGINE] - Deterministic Verification
   * Matches intent against native bank SMS credits.
   */
  public async verifyIntentViaSMS(intent: SettlementIntent): Promise<boolean> {
    if (Capacitor.getPlatform() !== 'android') return false;
    
    // 🛡️ [RULE_3] Idempotency Lock
    const db = getDB();
    if (db) {
        const res = await db.query(`SELECT status, metadata FROM settlement_intents WHERE id = ?`, [intent.id]);
        const current = res.values?.[0];
        if (current && (current.status === 'success' || current.status === 'VERIFIED')) {
            console.log(`[SMS_MATCH_IDEMPOTENT] Intent ${intent.id} is already verified/committed. STOP.`);
            return true;
        }
    } else if (intent.status === 'success' || intent.status === 'VERIFIED') {
        return true;
    }

    try {
        const { getNativeTransactions } = await import('@/integrations/smsBridge');
        const res = await getNativeTransactions(intent.sender_id);
        const txs = res.transactions || [];

        const intentTime = intent.metadata?.intent_launched_at ? new Date(intent.metadata.intent_launched_at).getTime() : new Date().getTime();
        const FIVE_MINUTES_MS = 5 * 60 * 1000;

        const match = txs.find(tx => {
            const txTime = typeof tx.timestamp === 'number' ? tx.timestamp : new Date(tx.timestamp || 0).getTime();
            const timeDiff = Math.abs(txTime - intentTime);

            // 🛡️ [RULE_2] Auto verification MUST require ALL conditions
            const isAmountMatch = Number(tx.amount) === intent.amount / 100; // SMS amount in Rupees, Intent in Paisa
            const isDirectionMatch = tx.type === 'debit'; // The payer checks their SMS, so it's a debit
            const isTimeMatch = timeDiff <= FIVE_MINUTES_MS;
            
            // Reference Match (if available)
            const expectedRef = intent.metadata?.sms_reference || intent.metadata?.upi_reference;
            const isRefMatch = expectedRef && tx.reference ? tx.reference.includes(expectedRef) : true;
            
            // UPI Handle / Sender Match (if available)
            const expectedUpi = intent.metadata?.receiver_upi_id;
            const isUpiMatch = expectedUpi && tx.sender ? (tx.sender.includes(expectedUpi) || (tx.description || "").includes(expectedUpi)) : true;

            return isAmountMatch && isDirectionMatch && isTimeMatch && isRefMatch && isUpiMatch;
        });

        if (match) {
            console.log(`[SMS_MATCH_SUCCESS] Intent: ${intent.id}, Ref: ${match.reference}`);
            
            // 🛡️ [RULE_5] & [RULE_7] Preserve metadata and transition to VERIFIED
            await this.updateStatus(intent.id, 'SMS_VERIFIED', { 
                sms_reference: match.reference,
                sms_timestamp: match.timestamp,
                verification_source: 'sms_bridge',
                verified_by: 'system',
                verified_at: new Date().toISOString()
            });
            
            await this.updateStatus(intent.id, 'VERIFIED');
            
            // 🛡️ [RULE_5] Commit Ledger Updates
            await this.commitLedgerForVerifiedIntent(intent);
            
            return true;
        } else {
            console.log(`[SMS_MATCH_FAILED] No match for Intent: ${intent.id}`);
            // Remains PENDING_VERIFICATION
        }
    } catch (err) {
        console.warn("[SMS_VERIFY_FAIL]", err);
    }
    return false;
  }

  /**
   * 🛡️ [RULE_5] Commits ledger update when status is VERIFIED
   */
  private async commitLedgerForVerifiedIntent(intent: SettlementIntent) {
      try {
          const { saveAndSync } = await import('@/integrations/sqliteService');
          
          const receiverName = intent.metadata?.receiver_name || "Member";
          const senderName = intent.metadata?.sender_name || "User";
          
          const rpcPayload = {
              p_group_id: intent.group_id,
              p_user_id: intent.metadata?.admin_id || intent.metadata?.user_id || 'system',
              p_title: `Settlement: ${senderName} -> ${receiverName}`,
              p_amount: intent.amount,
              p_paid_by_member_id: intent.sender_id,
              p_split_type: 'unequal',
              p_splits: [{ member_id: intent.receiver_id, user_id: intent.metadata?.receiver_user_id || null, share_amount: intent.amount }],
              p_idempotency_key: intent.idempotency_key,
              p_notes: `Auto-verified via SMS Bridge. Ref: ${intent.metadata?.sms_reference || ''}`,
              p_date: new Date().toISOString()
          };

          const expenseId = crypto.randomUUID();
          const finalRpcPayload = { ...rpcPayload, p_id: expenseId };

          console.log(`[LEDGER_COMMIT] Syncing verified settlement ${intent.id} to ledger.`);
          await saveAndSync("insert_group_expense_with_split", finalRpcPayload, "RPC");
      } catch (err) {
          console.error(`[LEDGER_COMMIT_ERROR] Failed to commit intent ${intent.id}:`, err);
      }
  }

  /**
   * 🚀 INITIALIZE (Lazy)
   * Sets up listeners and triggers initial recovery scan if needed.
   */
  public init() {
    if (this.isInitialized) return;
    console.log("[ORCHESTRATOR_INIT_COUNT] 1");
    console.log("[BOOT_1] PaymentOrchestrator startup (Lazy)");
    console.log("[PAYMENT_ORCHESTRATOR_INIT] Initializing payment orchestrator");
    
    // 🛡️ [RUNTIME_STABILIZATION] Use centralized lifecycle service
    lifecycleService.onResume(async () => {
        console.log("📱 [PAYMENT_RETURN] App resumed. Checking for pending intents...");
        if (this.isRecovering) return;
        
        // 🛡️ [RUNTIME_STABILIZATION] Add a small debounce to prevent scan-storm on rapid resume
        await new Promise(resolve => setTimeout(resolve, 300));
        await this.recoverPendingIntents();
    });
    
    // Initial startup scan (Safe to trigger after init)
    void this.recoverPendingIntents();
    this.isInitialized = true;
  }

  /**
   * 🚀 CREATE INTENT (NON-BLOCKING)
   */
  async createIntent(groupId: string, senderId: string, target: PaymentTarget): Promise<SettlementIntent | null> {
    if (this.isProcessing) {
        console.warn("[SETTLEMENT_DUPLICATE_BLOCK] Intent creation already in progress.");
        return null;
    }
    this.isProcessing = true;

    const intentId = crypto.randomUUID();
    console.log("[PAYMENT_LAUNCH] Initializing background intent:", intentId);

    const intent: SettlementIntent = {
      id: intentId,
      group_id: groupId,
      sender_id: senderId,
      receiver_id: target.id,
      amount: target.amount,
      currency: 'INR',
      status: 'created',
      payment_method: 'upi',
      idempotency_key: `man_${intentId.slice(0,8)}_${Date.now()}`,
      metadata: { 
          ...target.metadata, 
          receiver_name: target.name,
          platform: Capacitor.getPlatform(),
          initiated_at: new Date().toISOString(),
          events: [{ status: 'created', time: new Date().toISOString() }]
      }
    };

    // 🛡️ [BACKGROUND_PERSISTENCE]
    (async () => {
        try {
            const db = getDB();
            if (db) {
                await db.run(`
                    INSERT INTO settlement_intents (id, group_id, sender_id, receiver_id, amount, currency, status, payment_method, idempotency_key, metadata)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [intent.id, intent.group_id, intent.sender_id, intent.receiver_id, intent.amount, intent.currency, intent.status, intent.payment_method, intent.idempotency_key, JSON.stringify(intent.metadata)]);
            }

            const { error } = await supabase.from('settlement_intents').insert({
                id: intent.id,
                group_id: intent.group_id,
                sender_id: intent.sender_id,
                receiver_id: intent.receiver_id,
                amount: intent.amount,
                status: intent.status,
                idempotency_key: intent.idempotency_key,
                metadata: intent.metadata
            });

            if (error) console.error("[PAYMENT_PENDING] Remote sync failed, intent stored locally only.", error);
        } catch (e: any) {
            console.error("[TRACK_ERROR] Persistence crashed:", e.message);
        }
    })();

    this.activeIntentId = intent.id;
    localStorage.setItem('bk_active_payment_intent', intent.id);
    this.isProcessing = false;
    
    return intent;
  }

  /**
   * 🔄 UPDATE STATUS (With Audit Trail)
   */
  async updateStatus(intentId: string, status: SettlementStatus, additionalMetadata: any = {}): Promise<boolean> {
    if (this.isProcessing) return false;
    this.isProcessing = true;

    // 🛡️ [PHASE_3_HYBRID_MAPPING]
    const dbStatus = DB_STATUS_MAP[status] || status;
    console.log(`[ORCHESTRATOR_UPDATE_START] [${intentId}] Logic: ${status} -> DB: ${dbStatus}`);

    const db = getDB();
    try {
      let currentMetadata: any = {};
      
      // 🛡️ [GUARD] Fetch current state to check terminality and preserve metadata
      if (db) {
        const res = await db.query(`SELECT status, metadata FROM settlement_intents WHERE id = ?`, [intentId]);
        const current = res.values?.[0];
        if (current) {
            const currentStatus = current.status;
            if (currentStatus === 'success' || currentStatus === 'failed') {
                console.warn(`[SETTLEMENT_DUPLICATE_BLOCK] Blocked status update to ${status}. Intent ${intentId} is in terminal state ${currentStatus}.`);
                this.isProcessing = false;
                return false;
            }
            try { currentMetadata = JSON.parse(current.metadata); } catch(e) {}
        }
      }

      // Record Event
      const events = Array.isArray(currentMetadata.events) ? currentMetadata.events : [];
      events.push({ status, dbStatus, time: new Date().toISOString() });
      const updatedMetadata = { ...currentMetadata, ...additionalMetadata, events };

      if (db) {
        await db.run(`UPDATE settlement_intents SET status = ?, metadata = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [dbStatus, JSON.stringify(updatedMetadata), intentId]);
      }

      const { error } = await supabase
        .from('settlement_intents')
        .update({ status: dbStatus, metadata: updatedMetadata })
        .eq('id', intentId);

      if (error) {
        console.error(`[ORCHESTRATOR_UPDATE_FAIL] [${intentId}] Error:`, error);
        throw error;
      }

      console.log(`[ORCHESTRATOR_UPDATE_SUCCESS] [${intentId}]`);
      
      // 🕵️ [PHASE_3_FORENSICS]
      if (status === 'VERIFIED') console.log("[SETTLEMENT_VERIFIED]", intentId);
      if (status === 'DISPUTED') console.log("[SETTLEMENT_DISPUTED]", intentId);
      if (status === 'AWAITING_RECEIVER') console.log("[SETTLEMENT_AWAITING_RECEIVER]", intentId);
      if (status === 'PROCESSING') console.log("[UPI_APP_LAUNCHED]", intentId);

      if (dbStatus === 'success' || dbStatus === 'failed') {
        localStorage.removeItem('bk_active_payment_intent');
        this.activeIntentId = null;
      }
      return true;
    } catch (err) {
      console.error(`❌ [PaymentOrchestrator] Status update failed (${status}):`, err);
      return false;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 🛡️ RECOVERY logic
   */
  async recoverPendingIntents() {
    if (this.isRecovering) return;
    this.isRecovering = true;
    console.log("[RECOVERY_SCAN_START]");
    console.log("[BOOT_5] Recovery scan started");

    const db = getDB();
    const storedId = localStorage.getItem('bk_active_payment_intent');
    
    if (!storedId) {
        console.log("[BOOT_6] Recovery scan completed (No stored intent)");
        console.log("[RECOVERY_SCAN_SUCCESS] (No Work)");
        this.isRecovering = false;
        return;
    }

    try {
        let intent = null;
        if (db) {
            const res = await db.query(`SELECT * FROM settlement_intents WHERE id = ?`, [storedId]);
            if (res.values && res.values.length > 0) {
                intent = res.values[0];
            }
        }

        if (!intent) {
            console.log(`[RECOVERY_FETCH_START] [${storedId}]`);
            const { data, error } = await supabase.from('settlement_intents').select('*').eq('id', storedId).maybeSingle();
            if (error) {
                console.error(`[RECOVERY_FETCH_FAIL] [${storedId}] Error:`, error);
            } else {
                console.log(`[RECOVERY_FETCH_SUCCESS] [${storedId}]`);
            }
            intent = data;
        }

        if (intent && (intent.status === 'created' || intent.status === 'redirected')) {
            console.log("[PAYMENT_RECOVERY] Found active intent for recovery:", intent.id);
            await this.updateStatus(intent.id, 'pending_verification');
            window.dispatchEvent(new CustomEvent('payment_recovery_triggered', { detail: intent }));
        }
        console.log("[BOOT_6] Recovery scan completed");
        console.log("[RECOVERY_SCAN_SUCCESS]");
    } catch (err) {
        console.error("❌ [PaymentOrchestrator] Recovery failed:", err);
        console.error("[RECOVERY_SCAN_FAIL]");
    } finally {
        this.isRecovering = false;
    }
  }
}

export const paymentOrchestrator = new PaymentOrchestrator();
