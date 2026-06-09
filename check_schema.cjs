const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cbagjjhzsaxrzmulacxf.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiYWdqamh6c2F4cnptdWxhY3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzM3NTQsImV4cCI6MjA4NTk0OTc1NH0.cNoFa0ocpoTuMiE1RX5R2eotAZgyDEl3eGf9uUGzABI');

async function checkSupabaseSchema() {
  // Check columns in transactions table
  const { data: cols, error: colError } = await supabase.rpc('debug_get_table_columns', { p_table_name: 'transactions' });
  
  if (colError) {
     // Fallback: try to select one row and check keys
     const { data: oneRow, error: rowError } = await supabase.from('transactions').select('*').limit(1);
     if (rowError) {
       console.error('Schema check failed:', rowError);
       return;
     }
     if (oneRow && oneRow.length > 0) {
       const keys = Object.keys(oneRow[0]);
       console.log('Columns in transactions:', keys);
       console.log('canonical_key exists:', keys.includes('canonical_key'));
       console.log('idempotency_key exists:', keys.includes('idempotency_key'));
     } else {
       console.log('No rows in transactions to check columns. Attempting rpc debug...');
     }
  } else {
    console.log('Columns:', cols);
  }

  // Check unique indices - usually requires a special RPC or checking pg_indexes
  const { data: indexes, error: idxError } = await supabase.rpc('debug_get_table_indexes', { p_table_name: 'transactions' });
  if (idxError) {
    console.log('Index check RPC failed, trying raw query via another RPC...');
    const { data: rawIdx, error: rawError } = await supabase.rpc('execute_sql', { 
      sql_query: "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'transactions'" 
    });
    if (rawError) {
       console.error('Raw index check failed:', rawError);
    } else {
       console.log('Indexes:', rawIdx);
    }
  } else {
    console.log('Indexes:', indexes);
  }
}

checkSupabaseSchema();