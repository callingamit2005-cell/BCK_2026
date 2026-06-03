
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://cbagjjhzsaxrzmulacxf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiYWdqamh6c2F4cnptdWxhY3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzM3NTQsImV4cCI6MjA4NTk0OTc1NH0.cNoFa0ocpoTuMiE1RX5R2eotAZgyDEl3eGf9uUGzABI";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyRpcExistence() {
  console.log('[RPC_FORENSIC] Investigating existence of finalize_user_onboarding...');
  
  // Method 1: Check via OpenAPI (The same source PostgREST cache uses)
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: { 'apikey': SUPABASE_KEY }
    });
    const spec = await res.json();
    const paths = Object.keys(spec.paths || {});
    const rpcPath = paths.find(p => p.includes('finalize_user_onboarding'));
    
    if (rpcPath) {
      console.log('✅ FOUND IN OPENAPI:', rpcPath);
      console.log('PARAMETERS:', JSON.stringify(spec.paths[rpcPath].post.parameters, null, 2));
    } else {
      console.log('❌ NOT FOUND IN OPENAPI SPEC');
    }
  } catch (e) {
    console.log('❌ OPENAPI_FETCH_FAILED');
  }

  // Method 2: Attempt a dummy call with wrong params to trigger "hint" or "not found"
  // If it says "Could not find function", it's missing or cache is stale.
  // If it says "invalid parameters", it EXISTS but parameters don't match.
  console.log('[RPC_FORENSIC] Attempting probe call...');
  const { error } = await supabase.rpc('finalize_user_onboarding', { invalid_param: 'test' });
  
  if (error) {
    console.log('PROBE_RESULT:', error.code, error.message);
  }

  // Method 3: Check migration history table if RLS allows
  console.log('[RPC_FORENSIC] Checking migration history...');
  const { data: migrations, error: migError } = await supabase
    .from('_supabase_migrations') // standard name
    .select('*')
    .eq('version', '20260601000000');
    
  if (migError) {
    console.log('MIGRATION_TABLE_ACCESS_DENIED (Expected under RLS)');
  } else {
    console.log('MIGRATION_RECORD_FOUND:', migrations.length > 0);
  }
}

verifyRpcExistence();
