
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://cbagjjhzsaxrzmulacxf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiYWdqamh6c2F4cnptdWxhY3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzM3NTQsImV4cCI6MjA4NTk0OTc1NH0.cNoFa0ocpoTuMiE1RX5R2eotAZgyDEl3eGf9uUGzABI";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyProfileColumns() {
  console.log('[PROFILE_COLUMN_FORENSIC]');
  
  // Attempt to select privacy_completed
  const { data, error } = await supabase.from('profiles').select('id, privacy_completed').limit(1);
  
  if (error) {
    console.log(`PRIVACY_COMPLETED_STATUS: FAIL (${error.code}: ${error.message})`);
  } else {
    console.log(`PRIVACY_COMPLETED_STATUS: PASS`);
    console.log('SAMPLE_ROW:', JSON.stringify(data, null, 2));
  }
}

verifyProfileColumns();
