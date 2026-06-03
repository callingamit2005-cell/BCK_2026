
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://cbagjjhzsaxrzmulacxf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiYWdqamh6c2F4cnptdWxhY3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzM3NTQsImV4cCI6MjA4NTk0OTc1NH0.cNoFa0ocpoTuMiE1RX5R2eotAZgyDEl3eGf9uUGzABI";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkRpc() {
  console.log('--- RPC SCHEMA TRACE ---');
  // Attempt to call get_or_create_user_preferences with a dummy ID to see the return structure
  const { data, error } = await supabase.rpc("get_or_create_user_preferences", { p_user_id: '00000000-0000-0000-0000-000000000000' });
  
  if (error) {
    console.log('RPC_ERROR:', error.message);
  } else {
    console.log('RPC_RESULT:', JSON.stringify(data, null, 2));
  }
  console.log('------------------------');
}

checkRpc();
