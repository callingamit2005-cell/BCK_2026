
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://cbagjjhzsaxrzmulacxf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiYWdqamh6c2F4cnptdWxhY3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzM3NTQsImV4cCI6MjA4NTk0OTc1NH0.cNoFa0ocpoTuMiE1RX5R2eotAZgyDEl3eGf9uUGzABI";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verify() {
  console.log('Checking Supabase connection...');
  
  // 1. Check groups (anon key)
  const { data: groups, error: gError } = await supabase.from('groups').select('id, name');
  if (gError) console.error('Groups Fetch Error:', gError.message);
  else console.log('Groups visible to anon:', groups.length);

  // 2. Check members (anon key)
  const { data: members, error: mError } = await supabase.from('group_members').select('group_id, name');
  if (mError) console.error('Members Fetch Error:', mError.message);
  else console.log('Members visible to anon:', members.length);
}

verify();
