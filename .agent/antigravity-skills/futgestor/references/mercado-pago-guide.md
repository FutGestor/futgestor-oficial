# Mercado Pago Integration Guide - FutGestor

## Setup

```bash
npm install mercadopago
```

## Environment Variables

```env
MERCADO_PAGO_ACCESS_TOKEN=your_access_token
MERCADO_PAGO_PUBLIC_KEY=your_public_key
MERCADO_PAGO_WEBHOOK_SECRET=your_webhook_secret
```

## PIX Payment Creation (Edge Function)

```typescript
import { MercadoPagoConfig, Payment } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN")!,
});

const payment = new Payment(client);

// Create PIX payment
const result = await payment.create({
  body: {
    transaction_amount: amount / 100, // Convert centavos to reais
    description: `Mensalidade ${monthName} - ${teamName}`,
    payment_method_id: "pix",
    payer: {
      email: playerEmail,
      first_name: playerName,
      identification: {
        type: "CPF",
        number: playerCpf,
      },
    },
    metadata: {
      team_id: teamId,
      player_id: playerId,
      mensalidade_id: mensalidadeId,
    },
  },
});

// result.point_of_interaction.transaction_data.qr_code -> PIX code
// result.point_of_interaction.transaction_data.qr_code_base64 -> QR image
```

## Webhook Handler (Edge Function)

```typescript
serve(async (req) => {
  const body = await req.json();

  if (body.type === "payment") {
    const paymentId = body.data.id;
    const paymentInfo = await payment.get({ id: paymentId });

    const { team_id, player_id, mensalidade_id } = paymentInfo.metadata;

    await supabase
      .from("mensalidades")
      .update({
        status: paymentInfo.status, // approved, pending, rejected
        payment_id: paymentId,
        paid_at: paymentInfo.status === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", mensalidade_id);
  }

  return new Response("OK", { status: 200 });
});
```

## Payment Status Flow

```
created -> pending -> approved
                   -> rejected
                   -> cancelled
approved -> refunded
```
