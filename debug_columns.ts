
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://uwymdqweysrgdxbjwpzr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3eW1kcXdleXNyZ2R4Ymp3cHpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDg0NzcsImV4cCI6MjA4NjMyNDQ3N30.Vdv-jl9DoN4aC3rm_uPmfrZIsNRfcip6-qDuehQcCX4";
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugColumns() {
  const { data: team, error: teamError } = await supabase.from('teams').select('*').limit(1).single();
  const { data: time, error: timeError } = await supabase.from('times').select('*').limit(1).single();

  if (teamError) console.error('Team Error:', teamError);
  else console.log('Team columns:', Object.keys(team));

  if (timeError) console.error('Time Error:', timeError);
  else console.log('Time columns:', Object.keys(time));
}

debugColumns();
