
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://uwymdqweysrgdxbjwpzr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3eW1kcXdleXNyZ2R4Ymp3cHpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDg0NzcsImV4cCI6MjA4NjMyNDQ3N30.Vdv-jl9DoN4aC3rm_uPmfrZIsNRfcip6-qDuehQcCX4";
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUnidos() {
  const { data: times, error } = await supabase
    .from('times')
    .select('*, adversary_team:teams(escudo_url)')
    .eq('nome', 'Unidos FC');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Unidos FC records in times table:');
  console.log(JSON.stringify(times, null, 2));
}

debugUnidos();
