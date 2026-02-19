import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get client IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip")
      || "unknown";

    // Check rate limit
    const { data: allowed, error: rlError } = await supabase.rpc("check_solicitacao_rate_limit", { p_ip: ip });
    if (rlError) throw rlError;
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: "Limite de solicitações atingido. Tente novamente em 24 horas." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();

    // Validate required fields
    const { 
      nome_time, 
      email_contato, 
      telefone_contato, 
      data_preferida, 
      horario_preferido, 
      local_sugerido, 
      observacoes, 
      team_id,
      time_solicitante_id,
      user_solicitante_id,
      cep
    } = body;

    if (!nome_time || !telefone_contato || !data_preferida || !horario_preferido || !local_sugerido) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios não preenchidos." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process CEP
    const cepLimpo = cep ? cep.replace(/\D/g, '') : '';

    // Build insert data
    const insertData: Record<string, unknown> = {
      nome_time: String(nome_time).slice(0, 100),
      email_contato: email_contato ? String(email_contato).slice(0, 255) : null,
      telefone_contato: String(telefone_contato).slice(0, 20),
      data_preferida,
      horario_preferido,
      local_sugerido: String(local_sugerido).slice(0, 200),
      observacoes: observacoes ? String(observacoes).slice(0, 500) : null,
      team_id: team_id || null,
      time_solicitante_id: time_solicitante_id || null,
      user_solicitante_id: user_solicitante_id || null,
      ip_address: ip,
    };
    
    // Add CEP if valid (8 digits)
    if (cepLimpo && cepLimpo.length === 8) {
      insertData.cep = cepLimpo;
    }

    console.log("Inserting data:", insertData);

    const { error } = await supabase.from("solicitacoes_jogo").insert(insertData);

    if (error) {
      console.error("Insert error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
