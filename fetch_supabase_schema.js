
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://cbagjjhzsaxrzmulacxf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiYWdqamh6c2F4cnptdWxhY3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzM3NTQsImV4cCI6MjA4NTk0OTc1NH0.cNoFa0ocpoTuMiE1RX5R2eotAZgyDEl3eGf9uUGzABI";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchRemoteSchema() {
  console.log('[SUPABASE_SCHEMA_FORENSIC_START]');
  
  try {
    // 1. Get one row with select(*) to see all publicly accessible columns
    const { data, error } = await supabase.from('transactions').select('*').limit(1);
    
    if (error) {
      console.log('SELECT_ALL_ERROR:', error.message);
      
      // If select(*) fails (e.g. because of a specific column error), 
      // try to select known basic columns to at least get a partial result.
      const { data: partialData, error: partialError } = await supabase.from('transactions').select('id, amount, date').limit(1);
      if (partialError) {
          console.log('BASIC_SELECT_ERROR:', partialError.message);
      } else if (partialData && partialData.length > 0) {
          console.log('DEPLOYED_COLUMNS_PARTIAL:', Object.keys(partialData[0]).join(', '));
      }
    } else if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log('DEPLOYED_COLUMNS_TOTAL:', columns.length);
      console.log('ACTUAL_DEPLOYED_COLUMNS:', JSON.stringify(columns, null, 2));
      
      const checkList = ['canonical_key', 'idempotency_key', 'entry_source', 'payment_mode', 'is_deleted'];
      checkList.forEach(col => {
          console.log(`VERIFY_${col.toUpperCase()}: ${columns.includes(col)}`);
      });
    } else {
      console.log('NO_DATA_FOUND_BUT_QUERY_PASSED');
      // If table is empty, select(*) might still return empty array. 
      // PostgREST doesn't easily expose column names for empty tables via anon key.
    }

  } catch (e) {
    console.error('SYSTEM_ERROR:', e.message);
  }

  console.log('[SUPABASE_SCHEMA_FORENSIC_END]');
}

fetchRemoteSchema();
