package com.getcapacitor.myapp;

import static org.junit.Assert.*;

import android.content.Context;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.runner.RunWith;

import com.bachatkaro.smsengine.smstransactionengine.engine.SmsTransactionEngine;
import com.bachatkaro.smsengine.smstransactionengine.database.TransactionDao;
import com.bachatkaro.smsengine.smstransactionengine.model.Transaction;
import com.bachatkaro.smsengine.smstransactionengine.model.TransactionType;
import com.bachatkaro.smsengine.smstransactionengine.util.SmsEngineLogger;

import java.util.UUID;

@RunWith(AndroidJUnit4.class)
public class ExampleInstrumentedTest {

    @Test
    public void testEnterpriseIdentitySystem() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        SmsTransactionEngine engine = SmsTransactionEngine.getInstance(context);
        TransactionDao dao = new TransactionDao(context);
        
        // 1. Authoritative Identity (ATI) Test
        String ref = "UTR" + UUID.randomUUID().toString().substring(0, 8);
        String body1 = "Rs.100 debited from a/c 1234. Ref: " + ref;
        
        SmsTransactionEngine.ProcessResult res1 = engine.processLive("HDFCBK", body1, System.currentTimeMillis());
        assertTrue("First ATI insertion should succeed", res1 instanceof SmsTransactionEngine.ProcessResult.Saved);
        
        // 2. Duplicate ATI Test (Zombie Protection)
        // Mark as deleted locally
        long id1 = ((SmsTransactionEngine.ProcessResult.Saved) res1).getRowId();
        dao.delete(id1);
        
        // Re-ingest same ATI
        SmsTransactionEngine.ProcessResult res2 = engine.processLive("HDFCBK", body1, System.currentTimeMillis());
        assertTrue("Duplicate ATI should be skipped even if deleted", res2 instanceof SmsTransactionEngine.ProcessResult.Duplicate);
        
        // 3. SSF-60 Jitter Test
        String body2 = "Rs.500 spent at Zomato. No ref.";
        long ts1 = System.currentTimeMillis();
        SmsTransactionEngine.ProcessResult res3 = engine.processLive("SBIINB", body2, ts1);
        assertTrue("First SSF-60 insertion should succeed", res3 instanceof SmsTransactionEngine.ProcessResult.Saved);
        
        // Re-ingest with 5s jitter (Historical Scan Simulation)
        SmsTransactionEngine.ProcessResult res4 = engine.processLive("SBIINB", body2, ts1 + 5000);
        assertTrue("Jittered SSF-60 should be skipped due to Minute-Level Canonical Key", res4 instanceof SmsTransactionEngine.ProcessResult.Duplicate);
        
        // 4. SSF-60 Collision Detection (Possible Duplicate)
        String body3 = "Rs.500 spent at Zomato. Different body but same amount/time.";
        SmsTransactionEngine.ProcessResult res5 = engine.processLive("SBIINB", body3, ts1 + 10000);
        assertTrue("Collision within 60s window should be saved as POSSIBLE_DUPLICATE", res5 instanceof SmsTransactionEngine.ProcessResult.Saved);
        assertTrue("Flag should be set", ((SmsTransactionEngine.ProcessResult.Saved) res5).getTransaction().isPossibleDuplicate());
        
        // 5. Invariant Verification
        assertEquals("Total transactions should reflect 3 distinct logical events (even if 1 is deleted)", 3, dao.count());
    }
}
