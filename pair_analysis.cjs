const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cbagjjhzsaxrzmulacxf.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiYWdqamh6c2F4cnptdWxhY3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzM3NTQsImV4cCI6MjA4NTk0OTc1NH0.cNoFa0ocpoTuMiE1RX5R2eotAZgyDEl3eGf9uUGzABI');

async function extractPairs() {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, amount, description, date, type')
    .eq('entry_source', 'sms');
  
  if (error) {
    console.error(error);
    return;
  }

  const grouped = {};
  data.forEach(tx => {
    const key = `${tx.amount}|${tx.description}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(tx);
  });
  
  console.log('| Amount | Merchant | Timestamp Difference | Body Difference |');
  console.log('|---|---|---|---|');

  for (const [key, group] of Object.entries(grouped)) {
    if (group.length > 1) {
      for(let i=0; i<group.length; i++) {
        for(let j=i+1; j<group.length; j++) {
           const d1 = new Date(group[i].date).getTime();
           const d2 = new Date(group[j].date).getTime();
           const diff = Math.abs(d1 - d2);
           if (diff <= 30000 && diff > 0) {
              console.log(`| ${group[i].amount} | ${group[i].description} | ${diff/1000}s | Identical |`);
           }
        }
      }
    }
  }
}

extractPairs();