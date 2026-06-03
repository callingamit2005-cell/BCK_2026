
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://cbagjjhzsaxrzmulacxf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiYWdqamh6c2F4cnptdWxhY3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzM3NTQsImV4cCI6MjA4NTk0OTc1NH0.cNoFa0ocpoTuMiE1RX5R2eotAZgyDEl3eGf9uUGzABI";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function collectEvidence() {
  console.log('--- FINAL EVIDENCE COLLECTION ---');
  
  // Note: We are using the anon key. 
  // If RLS is enabled and "auth.uid() = id" is enforced, 
  // this query will return an empty array or error unless we had a JWT.
  // However, we can check the ERROR message to see if the COLUMNS are recognized by the API.
  
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      phone,
      upi_id,
      preferred_upi_app,
      upi_verification_state,
      created_at,
      updated_at,
      privacy_completed,
      has_completed_setup,
      country,
      preferred_language
    `)
    .limit(1);
  
  if (error) {
    console.log('QUERY_FAILED');
    console.log('ERROR_DETAILS:', JSON.stringify(error, null, 2));
  } else {
    console.log('QUERY_SUCCESS');
    console.log('PROFILE_QUERY_RESULT', JSON.stringify(data, null, 2));
  }
  
  console.log('--- COLLECTION END ---');
}

collectEvidence();
