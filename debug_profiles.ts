
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://uwymdqweysrgdxbjwpzr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3eW1kcXdleXNyZ2R4Ymp3cHpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDg0NzcsImV4cCI6MjA4NjMyNDQ3N30.Vdv-jl9DoN4aC3rm_uPmfrZIsNRfcip6-qDuehQcCX4";
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugProfiles() {
  const teamId = "899368e1-bf34-48fa-9c1d-b788f97e6a56"; // Unidos FC
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('team_id', teamId);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Profiles for Unidos FC:');
  console.log(JSON.stringify(profiles, null, 2));
}

debugProfiles();
