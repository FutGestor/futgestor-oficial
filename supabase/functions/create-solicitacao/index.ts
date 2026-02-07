import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
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

    // Validate captcha
    if (body.captcha_answer === undefined || body.captcha_answer !== body.captcha_expected) {
      return new Response(
        JSON.stringify({ error: "Resposta do captcha incorreta." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate required fields
    const { nome_time, telefone_contato, data_preferida, horario_preferido, local_sugerido } = body;
    if (!nome_time || !telefone_contato || !data_preferida || !horario_preferido || !local_sugerido) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios não preenchidos." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error } = await supabase.from("solicitacoes_jogo").insert({
      nome_time: String(nome_time).slice(0, 100),
      email_contato: body.email_contato ? String(body.email_contato).slice(0, 255) : null,
      telefone_contato: String(telefone_contato).slice(0, 20),
      data_preferida,
      horario_preferido,
      local_sugerido: String(local_sugerido).slice(0, 200),
      observacoes: body.observacoes ? String(body.observacoes).slice(0, 500) : null,
      team_id: body.team_id || null,
      ip_address: ip,
    });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
