import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callerUser }, error: authError } = await callerClient.auth.getUser();
    if (authError || !callerUser) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if caller is admin
    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role, team_id")
      .eq("user_id", callerUser.id)
      .eq("role", "admin");

    if (!callerRoles || callerRoles.length === 0) {
      return new Response(JSON.stringify({ error: "Apenas administradores podem gerar acesso" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminTeamId = callerRoles[0].team_id;

    const { jogador_id, email } = await req.json();

    if (!jogador_id || !email) {
      return new Response(JSON.stringify({ error: "jogador_id e email são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if jogador exists and belongs to admin's team
    const { data: jogador, error: jogadorError } = await supabaseAdmin
      .from("jogadores")
      .select("id, nome, team_id, user_id")
      .eq("id", jogador_id)
      .single();

    if (jogadorError || !jogador) {
      return new Response(JSON.stringify({ error: "Jogador não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (jogador.team_id !== adminTeamId) {
      return new Response(JSON.stringify({ error: "Jogador não pertence ao seu time" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (jogador.user_id) {
      return new Response(JSON.stringify({ error: "Este jogador já possui acesso vinculado" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const defaultPassword = "2508futgestor5515@";
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true, // Auto-confirm since admin is creating
      user_metadata: { nome: jogador.nome },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      if (createError.message?.includes("already been registered")) {
        return new Response(JSON.stringify({ error: "Este e-mail já está cadastrado no sistema" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newUserId = newUser.user.id;

    // Update profile: link to jogador and team
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        jogador_id: jogador_id,
        team_id: jogador.team_id,
        aprovado: true,
      })
      .eq("id", newUserId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    // Add 'user' role for the player
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: newUserId,
        role: "user",
        team_id: jogador.team_id,
      });

    if (roleError) {
      console.error("Error creating role:", roleError);
    }

    // Link jogador to user_id
    const { error: linkError } = await supabaseAdmin
      .from("jogadores")
      .update({ user_id: newUserId, email })
      .eq("id", jogador_id);

    if (linkError) {
      console.error("Error linking jogador:", linkError);
    }

    console.log(`Player access created: ${email} -> jogador ${jogador_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Acesso criado! E-mail: ${email} / Senha: ${defaultPassword}`,
        user_id: newUserId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in create-player-access:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
