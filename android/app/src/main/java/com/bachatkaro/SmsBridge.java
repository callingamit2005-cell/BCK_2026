package com.bachatkaro;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;

import com.bachatkaro.smsengine.smstransactionengine.database.TransactionDao;
import com.bachatkaro.smsengine.smstransactionengine.engine.SmsTransactionEngine;
import com.bachatkaro.smsengine.smstransactionengine.model.Transaction;
import com.bachatkaro.smsengine.smstransactionengine.model.TransactionType;
import com.bachatkaro.smsengine.smstransactionengine.sync.SyncSessionStore;
import com.bachatkaro.smsengine.smstransactionengine.sync.TransactionSyncScheduler;
import com.bachatkaro.smsengine.smstransactionengine.util.SmsEngineLogger;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import android.util.Log;
import org.json.JSONArray;
import org.json.JSONObject;

import java.math.BigDecimal;
import java.util.Calendar;
import java.util.List;

import com.getcapacitor.annotation.Permission;

import android.content.Intent;
import android.net.Uri;

@CapacitorPlugin(
    name = "SmsBridge",
    permissions = {
        @Permission(
            alias = "sms",
            strings = {
                Manifest.permission.READ_SMS,
                Manifest.permission.RECEIVE_SMS
            }
        ),
        @Permission(
            alias = "notifications",
            strings = {
                "android.permission.POST_NOTIFICATIONS"
            }
        )
    }
)
public class SmsBridge extends Plugin implements SmsTransactionEngine.Listener {

    private static final String TAG = "SmsBridge";

    @Override
    public void load() {
        super.load();
        SmsTransactionEngine.getInstance(getContext().getApplicationContext()).setListener(this);
    }

    @Override
    public void onResult(SmsTransactionEngine.ProcessResult result) {
        if (result instanceof SmsTransactionEngine.ProcessResult.Saved) {
            Transaction t = ((SmsTransactionEngine.ProcessResult.Saved) result).getTransaction();

            SmsEngineLogger.i("SMS_DEBUG", "New transaction saved natively: " + t.getSmsHash());

            JSObject ret = new JSObject();
            try {
                ret.put("transaction", transactionToJs(t));
                
                // [FORENSIC_TRACE] Log before emit
                Log.d("FORENSIC_TRACE", "BEFORE notifyListeners('newTransaction')");
                notifyListeners("newTransaction", ret);
                // [FORENSIC_TRACE] Log after emit
                Log.d("FORENSIC_TRACE", "AFTER notifyListeners('newTransaction')");

                // Trigger immediate sync to Supabase
                TransactionSyncScheduler.triggerImmediate(getContext().getApplicationContext());
            } catch (Exception e) {
                SmsEngineLogger.e(TAG, "Failed to notify JS of new transaction", e);
            }
        }
    }

    @PluginMethod
    public void checkSmsPermission(PluginCall call) {
        boolean granted = getContext().checkSelfPermission(Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED
                && getContext().checkSelfPermission(Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED;

        JSObject ret = new JSObject();
        if (granted) {
            ret.put("status", "granted");
        } else {
            ret.put("status", "denied");
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void requestSmsPermission(PluginCall call) {
        if (getContext().checkSelfPermission(Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED
                && getContext().checkSelfPermission(Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED) {
            JSObject ret = new JSObject();
            ret.put("status", "granted");
            call.resolve(ret);
        } else {
            requestPermissionForAlias("sms", call, "smsPermissionCallback");
        }
    }

    @com.getcapacitor.annotation.PermissionCallback
    private void smsPermissionCallback(PluginCall call) {
        boolean granted = getContext().checkSelfPermission(Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED
                && getContext().checkSelfPermission(Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED;

        JSObject ret = new JSObject();
        if (granted) {
            ret.put("status", "granted");
        } else {
            ret.put("status", "denied");
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void checkNotificationPermission(PluginCall call) {
        JSObject ret = new JSObject();
        if (android.os.Build.VERSION.SDK_INT >= 33) {
            boolean granted = getContext().checkSelfPermission("android.permission.POST_NOTIFICATIONS") == PackageManager.PERMISSION_GRANTED;
            ret.put("status", granted ? "granted" : "denied");
        } else {
            ret.put("status", "granted");
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        if (android.os.Build.VERSION.SDK_INT >= 33) {
            if (getContext().checkSelfPermission("android.permission.POST_NOTIFICATIONS") == PackageManager.PERMISSION_GRANTED) {
                JSObject ret = new JSObject();
                ret.put("status", "granted");
                call.resolve(ret);
            } else {
                requestPermissionForAlias("notifications", call, "notificationPermissionCallback");
            }
        } else {
            JSObject ret = new JSObject();
            ret.put("status", "granted");
            call.resolve(ret);
        }
    }

    @com.getcapacitor.annotation.PermissionCallback
    private void notificationPermissionCallback(PluginCall call) {
        boolean granted = getContext().checkSelfPermission("android.permission.POST_NOTIFICATIONS") == PackageManager.PERMISSION_GRANTED;
        JSObject ret = new JSObject();
        ret.put("status", granted ? "granted" : "denied");
        call.resolve(ret);
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        try {
            Intent intent = new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            Uri uri = Uri.fromParts("package", getContext().getPackageName(), null);
            intent.setData(uri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not open settings", e);
        }
    }

    @PluginMethod
    public void setSession(PluginCall call) {
        try {
            String userId = call.getString("userId");
            String token = call.getString("accessToken");

            if (userId == null || token == null) {
                call.reject("Missing userId or accessToken");
                return;
            }

            Context context = getContext().getApplicationContext();
            SyncSessionStore.save(context, userId, token);

            Log.d("SYNC_DEBUG", "Session saved: " + userId);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to set session", e);
        }
    }

    @PluginMethod
    public void updateSyncSession(PluginCall call) {
        try {
            String userId = call.getString("userId");
            String accessToken = call.getString("accessToken");
            String refreshToken = call.getString("refreshToken");
            Long expiresAt = call.getLong("expiresAt");

            if (userId == null || accessToken == null || refreshToken == null || expiresAt == null) {
                call.reject("Missing session data");
                return;
            }

            Context context = getContext().getApplicationContext();
            SyncSessionStore.save(
                context,
                new SyncSessionStore.SessionData(userId, accessToken, refreshToken, expiresAt)
            );

            SmsEngineLogger.i("SYNC_DEBUG", "Native Supabase session updated for user: " + userId);

            TransactionSyncScheduler.triggerImmediate(context);
            call.resolve();
        } catch (Exception e) {
            SmsEngineLogger.e(TAG, "Failed to update sync session", e);
            call.reject("Failed to update sync session", e);
        }
    }

    @PluginMethod
    public void getSyncSession(PluginCall call) {
        try {
            SyncSessionStore.SessionData session = SyncSessionStore.load(getContext().getApplicationContext());
            if (session == null) {
                call.resolve(new JSObject()); // Empty object if no session
                return;
            }

            JSObject ret = new JSObject();
            ret.put("userId", session.getUserId());
            ret.put("accessToken", session.getAccessToken());
            ret.put("refreshToken", session.getRefreshToken());
            ret.put("expiresAt", session.getExpiresAtEpochSeconds());
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to load sync session", e);
        }
    }

    @PluginMethod
    public void clearSyncSession(PluginCall call) {
        try {
            SyncSessionStore.clear(getContext().getApplicationContext());
            SmsEngineLogger.i("SYNC_DEBUG", "Native Supabase session cleared");
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to clear sync session", e);
        }
    }

    @PluginMethod
    public void getTransactions(PluginCall call) {
        getBridge().execute(() -> {
            try {
                String userId = call.getString("userId");
                Context context = getContext().getApplicationContext();
                TransactionDao dao = new TransactionDao(context);

                // ✅ PRODUCTION STRICT DATE RULE:
                // ALWAYS compute 2-month window: start of previous month → end of current month
                // This is the ONLY data window allowed — no exceptions.
                // Previous month = AI/prediction context
                // Current month  = Recent transactions display
                Calendar cal = Calendar.getInstance();

                // End bound: end of current month (last ms)
                cal.set(Calendar.DAY_OF_MONTH, cal.getActualMaximum(Calendar.DAY_OF_MONTH));
                cal.set(Calendar.HOUR_OF_DAY, 23);
                cal.set(Calendar.MINUTE, 59);
                cal.set(Calendar.SECOND, 59);
                cal.set(Calendar.MILLISECOND, 999);
                long endOfCurrentMonth = cal.getTimeInMillis();

                // Start bound: first ms of 6 months ago (less restrictive)
                cal.set(Calendar.DAY_OF_MONTH, 1);
                cal.set(Calendar.HOUR_OF_DAY, 0);
                cal.set(Calendar.MINUTE, 0);
                cal.set(Calendar.SECOND, 0);
                cal.set(Calendar.MILLISECOND, 0);
                cal.add(Calendar.MONTH, -6);
                long startOfSixMonthsAgo = cal.getTimeInMillis();

                // Override allowed via explicit params (for bootstrap/archival)
                long fromDate = call.getLong("fromDate", startOfSixMonthsAgo);
                long toDate   = call.getLong("toDate",   endOfCurrentMonth);

                SyncSessionStore.SessionData session = SyncSessionStore.load(context);
                String sessionUserId = session != null ? session.getUserId() : "NULL";

                Log.d(TAG, "[LEDGER_QUERY] Request: from=" + fromDate + " to=" + toDate + " paramUser=" + userId + " sessionUser=" + sessionUserId);

                int limit = call.getInt("limit", 50);
                int offset = call.getInt("offset", 0);

                List<Transaction> list = dao.getByDateRange(fromDate, toDate, userId, limit, offset);
                Log.d(TAG, "[LEDGER_QUERY] Result: count=" + list.size());

                JSONArray arr = new JSONArray();
                for (Transaction t : list) {
                    arr.put(transactionToJs(t));
                }

                JSObject result = new JSObject();
                result.put("transactions", arr);
                result.put("fromDate", fromDate);
                result.put("toDate", toDate);
                result.put("count", arr.length());
                result.put("offset", offset);
                result.put("limit", limit);
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Failed to load SMS transactions", e);
            }
        });
    }

    // Max SMS processed per scan — prevents ANR on devices with large SMS inbox
    private static final int SCAN_BATCH_SIZE = 500;
    // Progress event fired every N SMS processed
    private static final int PROGRESS_INTERVAL = 50;

    @PluginMethod
    public void scanHistoricalSms(PluginCall call) {
        boolean granted = getContext().checkSelfPermission(Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED
                && getContext().checkSelfPermission(Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED;

        if (!granted) {
            call.reject("SMS permission not granted");
            return;
        }

        getBridge().execute(() -> {
            try {
                Context context = getContext().getApplicationContext();

                // Compute start bound based on 'days' parameter (default 180)
                int days = call.getInt("days", 180);
                Calendar cal = Calendar.getInstance();
                cal.set(Calendar.HOUR_OF_DAY, 0);
                cal.set(Calendar.MINUTE, 0);
                cal.set(Calendar.SECOND, 0);
                cal.set(Calendar.MILLISECOND, 0);
                cal.add(Calendar.DAY_OF_MONTH, -days);
                long startOfSixMonthsAgo = cal.getTimeInMillis();
                // Upper bound: current time
                long currentTime = System.currentTimeMillis();

                android.content.ContentResolver cr = context.getContentResolver();
                android.database.Cursor cursor = cr.query(
                    android.net.Uri.parse("content://sms/inbox"),
                    new String[] { "address", "body", "date" },
                    "date >= ? AND date <= ?",
                    new String[] { String.valueOf(startOfSixMonthsAgo), String.valueOf(currentTime) },
                    "date DESC"
                );

                int scanned = 0;
                int saved = 0;
                int skipped = 0;

                if (cursor != null) {
                    // Get total count for progress reporting (Cap at 5000 for mobile safety)
                    int total = Math.min(cursor.getCount(), 5000);
                    SmsTransactionEngine engine = SmsTransactionEngine.getInstance(context);

                    while (cursor.moveToNext() && scanned < 5000) {
                        String address = cursor.getString(0);
                        String body = cursor.getString(1);
                        long date = cursor.getLong(2);

                        // Secondary validation: strict date boundary check
                        if (date < startOfSixMonthsAgo || date > currentTime) {
                            skipped++;
                            continue;
                        }

                        // Use historical processing to bypass live watermark
                        SmsTransactionEngine.ProcessResult result =
                            engine.processHistorical(address, body, date);

                        scanned++;

                        if (result instanceof SmsTransactionEngine.ProcessResult.Saved) {
                            saved++;
                        }

                        // Fire progress event every PROGRESS_INTERVAL SMS
                        if (scanned % PROGRESS_INTERVAL == 0) {
                            try {
                                JSObject progress = new JSObject();
                                progress.put("scanned", scanned);
                                progress.put("total", total);
                                progress.put("saved", saved);
                                notifyListeners("scanProgress", progress);
                            } catch (Exception ignored) {}
                        }
                    }
                    cursor.close();
                }

                JSObject ret = new JSObject();
                ret.put("scanned", scanned);
                ret.put("saved", saved);
                ret.put("skipped", skipped);
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("Historical scan failed", e);
            }
        });
    }

    @PluginMethod
    public void getPendingTransactions(PluginCall call) {
        getBridge().execute(() -> {
            try {
                int limit = call.getInt("limit", 50);
                String userId = call.getString("userId");
                Context context = getContext().getApplicationContext();
                TransactionDao dao = new TransactionDao(context);
                List<Transaction> list = dao.getUnsynced(limit, userId);

                JSONArray arr = new JSONArray();
                for (Transaction t : list) {
                    arr.put(transactionToJs(t));
                }

                JSObject result = new JSObject();
                result.put("transactions", arr);
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Failed to load pending transactions", e);
            }
        });
    }

    @PluginMethod
    public void updateSyncStatus(PluginCall call) {
        getBridge().execute(() -> {
            try {
                long id = call.getLong("id", -1L);
                String status = call.getString("status");

                if (id == -1L || status == null) {
                    call.reject("Missing id or status");
                    return;
                }

                Context context = getContext().getApplicationContext();
                TransactionDao dao = new TransactionDao(context);
                boolean success = dao.updateSyncStatus(id, status);

                if (success) {
                    call.resolve();
                } else {
                    call.reject("Failed to update sync status in DB");
                }
            } catch (Exception e) {
                call.reject("Failed to update sync status", e);
            }
        });
    }

    @PluginMethod
    public void upsertTransaction(PluginCall call) {
        getBridge().execute(() -> {
            try {
                JSObject txObj = call.getObject("transaction");
                if (txObj == null) {
                    call.reject("Missing transaction object");
                    return;
                }

                Transaction t = jsToTransaction(txObj);
                if (t == null) {
                    call.reject("Failed to parse transaction object");
                    return;
                }

                Context context = getContext().getApplicationContext();
                TransactionDao dao = new TransactionDao(context);
                long rowId = dao.upsert(t);

                if (rowId != -1L) {
                    JSObject result = new JSObject();
                    result.put("id", rowId);
                    call.resolve(result);
                } else {
                    call.reject("Failed to upsert transaction");
                }
            } catch (Exception e) {
                call.reject("Failed to upsert transaction", e);
            }
        });
    }

    @PluginMethod
    public void upsertTransactions(PluginCall call) {
        getBridge().execute(() -> {
            try {
                com.getcapacitor.JSArray txList = call.getArray("transactions");
                if (txList == null) {
                    call.reject("Missing transactions array");
                    return;
                }

                Context context = getContext().getApplicationContext();
                TransactionDao dao = new TransactionDao(context);

                dao.runInTransaction(new Runnable() {
                    @Override
                    public void run() {
                        for (int i = 0; i < txList.length(); i++) {
                            try {
                                JSObject txObj = JSObject.fromJSONObject(txList.getJSONObject(i));
                                Transaction t = jsToTransaction(txObj);
                                if (t != null) {
                                    dao.upsert(t);
                                }
                            } catch (Exception e) {
                                SmsEngineLogger.e(TAG, "Batch upsert error at index " + i, e);
                            }
                        }
                    }
                });

                JSObject result = new JSObject();
                result.put("count", txList.length());

                // Optional: trigger a sync check after restore
                TransactionSyncScheduler.triggerImmediate(getContext().getApplicationContext());

                call.resolve(result);
            } catch (Exception e) {
                SmsEngineLogger.e(TAG, "Batch upsert failed", e);
                call.reject("Failed to upsert transactions batch", e);
            }
        });
    }

    @PluginMethod
    public void isAppInstalled(PluginCall call) {
        String packageName = call.getString("packageName");
        if (packageName == null) {
            call.reject("Package name is required");
            return;
        }

        PackageManager pm = getContext().getPackageManager();
        boolean installed = false;
        try {
            pm.getPackageInfo(packageName, PackageManager.GET_ACTIVITIES);
            installed = true;
        } catch (PackageManager.NameNotFoundException e) {
            installed = false;
        }

        JSObject ret = new JSObject();
        ret.put("installed", installed);
        call.resolve(ret);
    }

    @PluginMethod
    public void deleteTransaction(PluginCall call) {
        getBridge().execute(() -> {
            try {
                long id = call.getLong("id", -1L);
                if (id == -1L) {
                    call.reject("Missing id");
                    return;
                }
                Context context = getContext().getApplicationContext();
                TransactionDao dao = new TransactionDao(context);
                boolean success = dao.delete(id);
                if (success) {
                    call.resolve();
                } else {
                    call.reject("Failed to delete from local DB");
                }
            } catch (Exception e) {
                call.reject("Failed to delete transaction", e);
            }
        });
    }

    @PluginMethod
    public void deleteAllTransactions(PluginCall call) {
        getBridge().execute(() -> {
            try {
                Context context = getContext().getApplicationContext();
                TransactionDao dao = new TransactionDao(context);
                int count = dao.deleteAll();
                JSObject ret = new JSObject();
                ret.put("count", count);
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("Failed to clear local DB", e);
            }
        });
    }

    private JSONObject transactionToJs(Transaction t) throws Exception {
        JSONObject obj = new JSONObject();
        obj.put("id", t.getId());
        obj.put("smsHash", t.getSmsHash());
        // 🛡️ [FINTECH STABILIZATION]
        // ALWAYS transmit raw paisa to the JS layer to prevent double-scaling bugs.
        obj.put("amount", t.getAmount());
        obj.put("type", t.getType().name());
        obj.put("sender", t.getSender());
        obj.put("timestamp", t.getTimestamp());
        obj.put("merchantName", t.getMerchantName());
        obj.put("reference", t.getReference());
        obj.put("syncStatus", t.getSyncStatus());
        obj.put("updatedAt", t.getUpdatedAt());
        return obj;
    }

    private Transaction jsToTransaction(JSObject obj) {
        try {
            return new Transaction(
                0L,
                obj.getString("smsHash", ""),
                obj.getString("sender", ""),
                obj.getString("rawBody", ""),
                TransactionType.valueOf(obj.getString("type", "UNKNOWN")),
                parseAmountFromJs(obj),
                obj.getString("currency", "INR"),
                obj.getString("accountRef", ""),
                obj.getString("reference", ""),
                obj.getString("merchantName", ""),
                obj.getString("category", "Others"),
                obj.getString("paymentHandle", ""),
                obj.getString("location", ""),
                0L, // Balance parsing omitted to prevent precision issues
                obj.has("timestamp") ? obj.getLong("timestamp") : System.currentTimeMillis(),
                obj.has("parsedAt") ? obj.getLong("parsedAt") : System.currentTimeMillis(),
                obj.getString("syncStatus", "completed").equals("completed"),
                obj.getString("syncStatus", "completed"),
                obj.has("updatedAt") ? obj.getLong("updatedAt") : System.currentTimeMillis(),
                obj.getString("userId", null),
                obj.getInteger("confidenceScore", 100),
                obj.getBoolean("isSplitGroup", false),
                obj.getBoolean("isDeleted", false)
            );
        } catch (Exception e) {
            return null;
        }
    }

    static long parseAmountFromJs(JSObject obj) {
        try {
            if (obj.has("amount")) {
                // Try as integer first (Paisa)
                Object amtObj = obj.get("amount");
                if (amtObj instanceof Number) {
                    return ((Number) amtObj).longValue();
                } else if (amtObj instanceof String) {
                    return Long.parseLong((String) amtObj);
                }
            }
            return 0L;
        } catch (Exception e) {
            return 0L;
        }
    }

    // Deprecated formatting methods intentionally removed to prevent accidental usage.
}
