
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://cbagjjhzsaxrzmulacxf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiYWdqamh6c2F4cnptdWxhY3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzM3NTQsImV4cCI6MjA4NTk0OTc1NH0.cNoFa0ocpoTuMiE1RX5R2eotAZgyDEl3eGf9uUGzABI";

async function verify() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  const { data: groups, error: gError } = await supabase.from('groups').select('id, name');
  if (gError) console.error(gError);
  else {
    const aGroup = groups.find(g => g.name.toLowerCase() === 'a');
    if (aGroup) console.log('FOUND GROUP WITH NAME A:', aGroup);
    else console.log('No group with name A found');
  }
}

verify();
