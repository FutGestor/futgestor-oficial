// Migrando para Deno.serve (padrão moderno das Edge Functions do Supabase)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Iniciando requisição create-player-access...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas!");
      throw new Error("Configuração do servidor incompleta.");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Tentativa de acesso sem cabeçalho de autorização.");
      return new Response(JSON.stringify({ error: "Sessão expirada ou não autorizado" }), {
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
      console.error("Erro ao validar token do usuário:", authError?.message);
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if caller is admin
    const { data: callerRoles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role, team_id")
      .eq("user_id", callerUser.id)
      .eq("role", "admin");

    if (rolesError) {
      console.error("Erro ao verificar roles do administrador:", rolesError.message);
    }

    if (!callerRoles || callerRoles.length === 0) {
      console.warn(`Usuário ${callerUser.id} tentou ação administrativa sem permissão.`);
      return new Response(JSON.stringify({ error: "Apenas administradores podem gerar acesso" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminTeamId = callerRoles[0].team_id;
    const requestData = await req.json();
    const { jogador_id, email } = requestData;

    console.log(`Dados recebidos para jogador_id: ${jogador_id}, email: ${email}`);

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
      console.error("Jogador não encontrado ou erro na busca:", jogadorError?.message);
      return new Response(JSON.stringify({ error: "Jogador não encontrado no banco de dados" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (jogador.team_id !== adminTeamId) {
      console.error(`Inconsistência de time: Admin ${adminTeamId} vs Jogador ${jogador.team_id}`);
      return new Response(JSON.stringify({ error: "Você não tem permissão para gerenciar este jogador" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (jogador.user_id) {
      return new Response(JSON.stringify({ error: "Este jogador já possui acesso e-mail vinculado." }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const defaultPassword = "2508futgestor5515@";
    console.log(`Criando usuário Auth para ${email}...`);
    
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: { nome: jogador.nome },
    });

    if (createError) {
      console.error("Erro no auth.admin.createUser:", createError.message);
      if (createError.message?.toLowerCase().includes("already registered") || createError.message?.toLowerCase().includes("already been registered")) {
        return new Response(JSON.stringify({ error: "Este e-mail já está em uso por outro usuário no sistema." }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: `Erro no auth: ${createError.message}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newUserId = newUser.user.id;

    // Vinculação sequencial para garantir integridade
    console.log("Atualizando perfil e roles...");
    
    // 1. Update profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        jogador_id: jogador_id,
        team_id: jogador.team_id,
        aprovado: true,
      })
      .eq("id", newUserId);

    if (profileError) console.error("Erro ao atualizar profile:", profileError.message);

    // 2. Add 'user' role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: newUserId,
        role: "user",
        team_id: jogador.team_id,
      });

    if (roleError) console.error("Erro ao criar role:", roleError.message);

    // 3. Link jogador to user_id e email
    const { error: linkError } = await supabaseAdmin
      .from("jogadores")
      .update({ user_id: newUserId, email })
      .eq("id", jogador_id);

    if (linkError) {
      console.error("Erro crítico ao vincular jogador:", linkError.message);
      return new Response(JSON.stringify({ error: "Usuário criado mas falha ao vincular com a ficha de jogador." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Sucesso! Acesso gerado para ${email}.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Acesso criado com sucesso! O jogador já pode entrar com o e-mail informado e a senha padrão do clube.`,
        user_id: newUserId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("ERRO GLOBAL NA EDGE FUNCTION:", error.message);
    return new Response(JSON.stringify({ error: `Erro interno: ${error.message}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
