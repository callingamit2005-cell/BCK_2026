const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cbagjjhzsaxrzmulacxf.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiYWdqamh6c2F4cnptdWxhY3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzM3NTQsImV4cCI6MjA4NTk0OTc1NH0.cNoFa0ocpoTuMiE1RX5R2eotAZgyDEl3eGf9uUGzABI');

async function findDuplicates() {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, amount, description, date, created_at, sms_hash, canonical_key, idempotency_key, entry_source')
    .eq('entry_source', 'sms');
  
  if (error) {
    console.error('Error fetching data:', error);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('No sms transactions found.');
    return;
  }
  
  console.log('Total SMS transactions:', data.length);
  
  // Group by amount and description to find duplicates
  const grouped = {};
  data.forEach(tx => {
    const key = `${tx.amount}|${tx.description}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(tx);
  });
  
  let dupCount = 0;
  for (const [key, group] of Object.entries(grouped)) {
    if (group.length > 1) {
      // check if dates are within 10 seconds
      for(let i=0; i<group.length; i++) {
        for(let j=i+1; j<group.length; j++) {
           const d1 = new Date(group[i].date).getTime();
           const d2 = new Date(group[j].date).getTime();
           if (Math.abs(d1 - d2) <= 10000) {
              console.log('--- DUPLICATE PAIR FOUND ---');
              console.log('A:', JSON.stringify(group[i], null, 2));
              console.log('B:', JSON.stringify(group[j], null, 2));
              console.log('Time Diff (ms):', Math.abs(d1 - d2));
              dupCount++;
           }
        }
      }
    }
  }
  console.log('Total Duplicate Pairs Found:', dupCount);
}

findDuplicates();