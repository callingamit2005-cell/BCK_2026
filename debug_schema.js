
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://cbagjjhzsaxrzmulacxf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiYWdqamh6c2F4cnptdWxhY3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzM3NTQsImV4cCI6MjA4NTk0OTc1NH0.cNoFa0ocpoTuMiE1RX5R2eotAZgyDEl3eGf9uUGzABI";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debug() {
  console.log('[DEBUG_START]');
  
  // Attempt to select columns from profiles to see what exists
  // Since we don't have a user ID, we'll try to get the table structure via an empty select
  // Or just check if we can see any public profile if RLS allows.
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  
  if (error) {
    console.log('PROFILE_QUERY_ERROR:', JSON.stringify(error, null, 2));
  } else {
    console.log('PROFILE_QUERY_RESULT:', JSON.stringify(data, null, 2));
    if (data && data.length > 0) {
      console.log('PRESENT_KEYS:', Object.keys(data[0]).join(', '));
    } else {
      console.log('NO_ROWS_RETURNED_BY_ANON');
    }
  }

  // Try to inspect columns via PostgREST OpenAPI spec
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: { 'apikey': SUPABASE_KEY }
    });
    const schema = await res.json();
    const profilesTable = schema.definitions.profiles;
    if (profilesTable) {
        console.log('PROFILES_SCHEMA_COLUMNS:', Object.keys(profilesTable.properties).join(', '));
    }
  } catch (e) {
    console.log('SCHEMA_INSPECTION_FAILED');
  }

  console.log('[DEBUG_END]');
}

debug();
