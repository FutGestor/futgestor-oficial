import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://uwymdqweysrgdxbjwpzr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3eW1kcXdleXNyZ2R4Ymp3cHpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDg0NzcsImV4cCI6MjA4NjMyNDQ3N30.Vdv-jl9DoN4aC3rm_uPmfrZIsNRfcip6-qDuehQcCX4";

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
  console.log("Searching for ALL teams named 'Unidos FC'...");
  const { data: teams, error } = await supabase
    .from('teams')
    .select('*')
    .ilike('nome', '%Unidos FC%');
    
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log("Found " + (teams?.length || 0) + " teams.");
  console.log(JSON.stringify(teams, null, 2));
}

debug();
