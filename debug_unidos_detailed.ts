
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://uwymdqweysrgdxbjwpzr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3eW1kcXdleXNyZ2R4Ymp3cHpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDg0NzcsImV4cCI6MjA4NjMyNDQ3N30.Vdv-jl9DoN4aC3rm_uPmfrZIsNRfcip6-qDuehQcCX4";
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDetailed() {
  console.log("=== TEAMS (Profile Source) ===");
  const { data: teams } = await supabase
    .from('teams')
    .select('id, nome, escudo_url, slug')
    .or('nome.ilike.%Unidos%,nome.ilike.%unidos%');
  console.log("Teams found:", teams);

  console.log("\n=== TIMES (Agenda Source) ===");
  const { data: times } = await supabase
    .from('times')
    .select('id, nome, escudo_url, team_id, adversary_team:teams(id, nome, escudo_url)')
    .or('nome.ilike.%Unidos%,nome.ilike.%unidos%');
  console.log("Times found:", JSON.stringify(times, null, 2));

  console.log("\n=== JOGOS (Games) ===");
  // Fetch games that involve these times OR have 'Unidos' in the string
  const { data: jogos } = await supabase
    .from('jogos')
    .select(`
      id, 
      data_hora, 
      adversario, 
      time_adversario_id, 
      time_adversario:times(id, nome, escudo_url, team_id)
    `)
    .or('adversario.ilike.%Unidos%,adversario.ilike.%unidos%')
    .limit(5);

  console.log("Jogos found:", JSON.stringify(jogos, null, 2));
}

debugDetailed();
