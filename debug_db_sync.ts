
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://uwymdqweysrgdxbjwpzr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3eW1kcXdleXNyZ2R4Ymp3cHpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDg0NzcsImV4cCI6MjA4NjMyNDQ3N30.Vdv-jl9DoN4aC3rm_uPmfrZIsNRfcip6-qDuehQcCX4";
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDataDiscrepancy() {
  console.log("--- TEAMS (Registered Users) ---");
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id, nome, escudo_url, slug')
    .ilike('nome', '%Unidos%');
  
  if (teamsError) console.error(teamsError);
  console.log(JSON.stringify(teams, null, 2));

  console.log("\n--- TIMES (Opponents/Agenda) ---");
  const { data: times, error: timesError } = await supabase
    .from('times')
    .select('id, nome, escudo_url, team_id, adversary_team:teams(id, nome, escudo_url)') // Check relation
    .ilike('nome', '%Unidos%');

  if (timesError) console.error(timesError);
  console.log(JSON.stringify(times, null, 2));

  console.log("\n--- JOGOS (Games) where opponent is Unidos ---");
  const { data: jogos, error: jogosError } = await supabase
    .from('jogos')
    .select('id, data_hora, adversario, time_adversario_id, time_adversario:times(id, nome, escudo_url)')
    .ilike('adversario', '%Unidos%');

  if (jogosError) console.error(jogosError);
  console.log(JSON.stringify(jogos, null, 2));
}

debugDataDiscrepancy();
