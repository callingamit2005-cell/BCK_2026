const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://cbagjjhzsaxrzmulacxf.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiYWdqamh6c2F4cnptdWxhY3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzM3NTQsImV4cCI6MjA4NTk0OTc1NH0.cNoFa0ocpoTuMiE1RX5R2eotAZgyDEl3eGf9uUGzABI');

function normalize(text) {
  if (!text) return "";
  return text.toLowerCase()
    .replace(/\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\bdr\.?\b/g, "debited")
    .replace(/\bcr\.?\b/g, "credited")
    .replace(/\ba\/c\b/g, "account")
    .replace(/\bavlbal\b/g, "balance")
    .replace(/\bavl\s+bal\b/g, "balance")
    .replace(/\bbal:\b/g, "balance")
    .replace(/today/g, "")
    .replace(/yesterday/g, "")
    .replace(/₹/g, "rs ")
    .replace(/inr/g, "rs ")
    .replace(/\s+/g, " ")
    .trim();
}

async function validateFingerprints() {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, amount, description, date, type, entry_source, created_at, sms_hash, source')
    // We only care about sms sourced items, as they are subject to this fingerprint logic
    .eq('entry_source', 'sms');

  if (error) {
    console.error(error);
    return;
  }

  // To do a true normalized body hash test, we need the raw SMS body.
  // The 'transactions' table might not store 'rawBody' directly if it's named differently or omitted.
  // Wait, let's check columns for rawBody...
  // In previous inspection, the columns were: [..., 'category', 'description', 'source', 'date', ...]
  // Actually, 'description' usually holds the extracted merchant, NOT the raw body in Supabase.
  // The raw body might not be sent to Supabase in this application to save space, or it might be in 'note'.
  // Let's fetch one row to see if the full body is stored anywhere.
  const { data: cols } = await supabase.from('transactions').select('*').eq('entry_source', 'sms').limit(1);
  console.log('Available columns in DB for fingerprinting:', cols ? Object.keys(cols[0]) : 'None');
  
  // Wait, the instructions require generating normalized_body_hash.
  // If raw body isn't in Supabase, we can't test it directly on historical cloud data.
  // But let's check if 'description' contains the full body or just the merchant.
  if (cols && cols.length > 0) {
     console.log('Sample Description:', cols[0].description);
     // Usually description = MerchantName. 
     // We cannot do a body hash test if the body isn't stored in the cloud.
     // Let's inform the next step.
  }
}

validateFingerprints();