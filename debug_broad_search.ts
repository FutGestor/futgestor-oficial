
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://uwymdqweysrgdxbjwpzr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3eW1kcXdleXNyZ2R4Ymp3cHpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDg0NzcsImV4cCI6MjA4NjMyNDQ3N30.Vdv-jl9DoN4aC3rm_uPmfrZIsNRfcip6-qDuehQcCX4";
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugBroad() {
  console.log("=== SEARCHING TEAMS ===");
  const { data: teams } = await supabase
    .from('teams')
    .select('id, nome, escudo_url, slug')
    .order('created_at', { ascending: false });
  
  // Filter manually to catch anything weird
  const unidosTeams = teams?.filter(t => t.nome?.toLowerCase().includes('unidos'));
  console.log("Teams matching 'unidos':", JSON.stringify(unidosTeams, null, 2));

  console.log("\n=== SEARCHING TIMES ===");
  const { data: times } = await supabase
    .from('times')
    .select('id, nome, escudo_url, team_id')
    .order('created_at', { ascending: false });

  const unidosTimes = times?.filter(t => t.nome?.toLowerCase().includes('unidos'));
  console.log("Times matching 'unidos':", JSON.stringify(unidosTimes, null, 2));

  console.log("\n=== SEARCHING JOGOS ===");
  const { data: jogos } = await supabase
    .from('jogos')
    .select('id, data_hora, adversario, time_adversario_id, time_adversario:times(id, nome, team_id)')
    .order('data_hora', { ascending: false })
    .limit(20);

  const unidosJogos = jogos?.filter(j => 
    j.adversario?.toLowerCase().includes('unidos') || 
    (j.time_adversario && j.time_adversario.nome.toLowerCase().includes('unidos'))
  );
  console.log("Jogos matching 'unidos':", JSON.stringify(unidosJogos, null, 2));
}

debugBroad();
