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
    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN");

    if (!mpAccessToken) {
      console.error("MP_ACCESS_TOKEN not configured");
      return new Response("Config error", { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    console.log("MP webhook received:", JSON.stringify(body));

    const { type, data } = body;

    if (type === "payment" && data?.id) {
      const paymentResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${data.id}`,
        {
          headers: { Authorization: `Bearer ${mpAccessToken}` },
        }
      );

      if (!paymentResponse.ok) {
        const errText = await paymentResponse.text();
        console.error("Error fetching payment:", errText);
        return new Response("Error fetching payment", { status: 500, headers: corsHeaders });
      }

      const payment = await paymentResponse.json();
      console.log("Payment details:", JSON.stringify({
        id: payment.id,
        status: payment.status,
        external_reference: payment.external_reference,
        payment_method_id: payment.payment_method_id,
        transaction_amount: payment.transaction_amount,
      }));

      if (!payment.external_reference) {
        console.log("No external_reference, skipping");
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      let refData: { team_id: string; plano: string; user_id: string };
      try {
        refData = JSON.parse(payment.external_reference);
      } catch {
        console.error("Invalid external_reference:", payment.external_reference);
        return new Response("Invalid reference", { status: 400, headers: corsHeaders });
      }

      const { team_id, plano } = refData;

      // Determine payment method label
      const methodId = payment.payment_method_id || "";
      let metodo = "outro";
      if (methodId === "pix") metodo = "pix";
      else if (["visa", "master", "amex", "elo", "hipercard", "debvisa", "debmaster", "debelo"].includes(methodId)) metodo = "cartao";
      else if (methodId === "bolbradesco" || methodId === "pec") metodo = "boleto";

      // Log the payment in saas_payments
      const paymentStatus = payment.status === "approved" ? "approved" : payment.status === "pending" ? "pending" : payment.status;
      const { error: logError } = await supabase
        .from("saas_payments")
        .insert({
          team_id,
          plano,
          valor: payment.transaction_amount || 0,
          status: paymentStatus,
          metodo,
          mp_payment_id: String(payment.id),
        });

      if (logError) {
        console.error("Error logging saas_payment:", logError);
      } else {
        console.log(`SaaS payment logged: team=${team_id}, plan=${plano}, status=${paymentStatus}, amount=${payment.transaction_amount}`);
      }

      if (payment.status === "approved") {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const { error: subError } = await supabase
          .from("subscriptions")
          .upsert(
            {
              team_id,
              plano,
              status: "active",
              mp_subscription_id: String(payment.id),
              mp_preference_id: payment.preference_id || null,
              expires_at: expiresAt.toISOString(),
            },
            { onConflict: "team_id" }
          );

        if (subError) {
          console.error("Error upserting subscription:", subError);
          return new Response("DB error", { status: 500, headers: corsHeaders });
        }

        const { error: teamError } = await supabase
          .from("teams")
          .update({ plano })
          .eq("id", team_id);

        if (teamError) {
          console.error("Error updating team plan:", teamError);
        }

        console.log(`Subscription activated for team ${team_id}, plan ${plano}`);
      } else if (payment.status === "rejected" || payment.status === "cancelled") {
        console.log(`Payment ${payment.status} for team ${team_id}`);
      }
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});
