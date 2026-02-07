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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN");

    if (!mpAccessToken) {
      console.error("MP_ACCESS_TOKEN not configured");
      return new Response(
        JSON.stringify({ error: "Mercado Pago não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { plano, team_id, success_url, failure_url } = await req.json();

    if (!plano || !team_id) {
      return new Response(
        JSON.stringify({ error: "plano e team_id são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin of this team
    const { data: isAdmin } = await supabase.rpc("is_team_admin", {
      _user_id: user.id,
      _team_id: team_id,
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Apenas admins podem assinar planos" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Plan pricing
    const plans: Record<string, { title: string; price: number }> = {
      pro: { title: "FutGestor Pro - Mensal", price: 29.90 },
    };

    const selectedPlan = plans[plano];
    if (!selectedPlan) {
      return new Response(
        JSON.stringify({ error: "Plano inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Creating MP preference for team ${team_id}, plan ${plano}`);

    // Create MP preference
    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mpAccessToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            title: selectedPlan.title,
            quantity: 1,
            unit_price: selectedPlan.price,
            currency_id: "BRL",
          },
        ],
        back_urls: {
          success: success_url || `${req.headers.get("origin")}/`,
          failure: failure_url || `${req.headers.get("origin")}/`,
          pending: success_url || `${req.headers.get("origin")}/`,
        },
        auto_return: "approved",
        external_reference: JSON.stringify({ team_id, plano, user_id: user.id }),
        notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
      }),
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error("MP API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao criar preferência no Mercado Pago" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mpData = await mpResponse.json();
    console.log(`MP preference created: ${mpData.id}`);

    return new Response(
      JSON.stringify({
        init_point: mpData.init_point,
        preference_id: mpData.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating preference:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
