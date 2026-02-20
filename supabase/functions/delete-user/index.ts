import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user's JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Failed to verify JWT:", claimsError);
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callerId = claimsData.claims.sub;
    console.log("Caller ID:", callerId);

    // Create admin client with service role for database queries
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if caller is super_admin (God Admin) - pode deletar qualquer usuário
    const { data: isSuperAdmin, error: superAdminError } = await supabaseClient.rpc("is_super_admin", {
      _user_id: callerId,
    });

    if (superAdminError) {
      console.error("Error checking super_admin status:", superAdminError);
    }

    // Se não for super_admin, verificar se é admin do mesmo time do usuário alvo
    if (!isSuperAdmin) {
      // Check if caller is admin
      const { data: isAdmin, error: roleError } = await supabaseClient.rpc("has_role", {
        _user_id: callerId,
        _role: "admin",
      });

      if (roleError || !isAdmin) {
        console.error("Caller is not admin:", roleError);
        return new Response(
          JSON.stringify({ error: "Apenas administradores podem excluir usuários" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Parse request body para obter o userId
      const { userId } = await req.json();
      
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "ID do usuário é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // VERIFICAÇÃO CRÍTICA: Verificar se o caller e o target pertencem ao mesmo time
      // Buscar team_id do caller (admin)
      const { data: callerProfile, error: callerProfileError } = await supabaseAdmin
        .from("profiles")
        .select("team_id")
        .eq("id", callerId)
        .single();

      if (callerProfileError || !callerProfile?.team_id) {
        console.error("Erro ao buscar profile do caller:", callerProfileError);
        return new Response(
          JSON.stringify({ error: "Não foi possível verificar permissões do administrador" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Buscar team_id do usuário alvo
      const { data: targetProfile, error: targetProfileError } = await supabaseAdmin
        .from("profiles")
        .select("team_id")
        .eq("id", userId)
        .single();

      if (targetProfileError) {
        console.error("Erro ao buscar profile do usuário alvo:", targetProfileError);
        return new Response(
          JSON.stringify({ error: "Usuário não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verificar se ambos pertencem ao mesmo time
      if (targetProfile?.team_id !== callerProfile.team_id) {
        console.error(`Permissão negada: Caller team ${callerProfile.team_id} vs Target team ${targetProfile?.team_id}`);
        return new Response(
          JSON.stringify({ error: "Você não tem permissão para excluir usuários de outros times" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Admin ${callerId} (time ${callerProfile.team_id}) autorizado a deletar usuário ${userId}`);
    }

    // Parse request body (se ainda não foi parseado)
    const body = await req.json().catch(() => null);
    const userId = body?.userId;
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "ID do usuário é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent admin from deleting themselves
    if (userId === callerId) {
      return new Response(
        JSON.stringify({ error: "Você não pode excluir sua própria conta" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Deleting user:", userId);

    // Delete user from auth.users (this cascades to profiles and user_roles)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return new Response(
        JSON.stringify({ error: `Erro ao excluir usuário: ${deleteError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User deleted successfully:", userId);

    return new Response(
      JSON.stringify({ success: true, message: "Usuário excluído com sucesso" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
