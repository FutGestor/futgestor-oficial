
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://uwymdqweysrgdxbjwpzr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3eW1kcXdleXNyZ2R4Ymp3cHpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDg0NzcsImV4cCI6MjA4NjMyNDQ3N30.Vdv-jl9DoN4aC3rm_uPmfrZIsNRfcip6-qDuehQcCX4";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQuery() {
  const teamId = "2c800957-5a8b-402c-893f-a567c7947214"; // tucklast
  console.log(`Checking query for team ID: ${teamId}`);

  const { data: jogos, error: jogosError } = await supabase
    .from("jogos")
    .select(`
      id, 
      data_hora, 
      adversario,
      time_adversario:times(
        id, 
        nome, 
        team_id,
        adversary_team:teams(id, nome, escudo_url)
      )
    `)
    .eq("team_id", teamId)
    .order("data_hora", { ascending: false })
    .limit(5);

  if (jogosError) {
    console.error("Error fetching jogos:", jogosError);
    return;
  }

  console.log("Jogos found:", jogos?.length);
  if (jogos) {
    jogos.forEach(j => {
      console.log(`\nJogo ID: ${j.id}`);
      console.log(`Adversario (string): ${j.adversario}`);
      
      const ta = j.time_adversario as any;
      if (ta) {
          console.log(`  -> time_adversario.nome (stale): ${ta.nome}`);
          console.log(`  -> time_adversario.team_id: ${ta.team_id}`);
          if (ta.adversary_team) {
              console.log(`  -> adversary_team.nome (synced): ${ta.adversary_team.nome}`);
              console.log(`  -> adversary_team.escudo_url: ${ta.adversary_team.escudo_url}`);
          } else {
              console.log(`  -> adversary_team is NULL/UNDEFINED`);
          }
      } else {
          console.log(`  -> time_adversario is NULL`);
      }
    });
  }
}

checkQuery();
