const { createClient } = require('@supabase/supabase-js');
const { parseISO } = require('date-fns');

const supabase = createClient('https://cbagjjhzsaxrzmulacxf.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiYWdqamh6c2F4cnptdWxhY3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzM3NTQsImV4cCI6MjA4NTk0OTc1NH0.cNoFa0ocpoTuMiE1RX5R2eotAZgyDEl3eGf9uUGzABI');

const safeDate = (value) => {
  if (!value) return null;
  let normalized = typeof value === 'string' ? value.replace(' ', 'T') : value;
  if (typeof normalized === 'string' && !normalized.includes('Z') && !/[+-]\d{2}:?\d{2}$/.test(normalized)) {
    normalized = normalized + 'Z';
  }
  const parsed = parseISO(normalized);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const generateCanonicalKey = (entry) => {
  const normAmount = Math.round(Number(entry.amount || 0));
  const dateObj = safeDate(entry.date);
  const ts = dateObj ? Math.round(dateObj.getTime() / 1000) : 0;
  const normPayee = (entry.payee || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const type = (entry.type || "expense").toLowerCase();
  return (ts > 0 && normAmount > 0) ? `canon:${normAmount}:${ts}:${normPayee}:${type}` : null;
};

async function testCollisions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, amount, description, date, type')
    .eq('entry_source', 'sms');
  
  if (error) {
    console.error(error);
    return;
  }

  console.log('| ID | Amount | Merchant | Date | Type | Canonical Key |');
  console.log('|---|---|---|---|---|---|');

  const keys = new Map();
  const collisions = [];

  data.forEach(tx => {
    const entry = {
      amount: tx.amount,
      date: tx.date,
      payee: tx.description,
      type: tx.type === 'income' ? 'income' : 'expense'
    };
    const key = generateCanonicalKey(entry);
    console.log(`| ${tx.id.substring(0,8)} | ${tx.amount} | ${tx.description} | ${tx.date} | ${entry.type} | ${key} |`);
    
    if (keys.has(key)) {
      collisions.push({ key, tx1: keys.get(key), tx2: tx });
    } else {
      keys.set(key, tx);
    }
  });

  console.log('\nTotal Collisions:', collisions.length);
  collisions.forEach(c => {
    console.log(`Collision on Key: ${c.key}`);
    console.log(`  - TX1: ${c.tx1.id} (${c.tx1.date})`);
    console.log(`  - TX2: ${c.tx2.id} (${c.tx2.date})`);
  });
}

testCollisions();