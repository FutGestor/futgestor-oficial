---
name: futgestor
description: Use this skill when working on FutGestor, a multi-tenant SaaS platform for managing amateur soccer teams in Brazil. Triggers include any mention of FutGestor, team management, player registration, payment integration with Mercado Pago, match scheduling, monthly fees (mensalidades), or amateur football management features. Also use when working with FutGestor's Supabase backend, Row Level Security policies, or its React/TypeScript frontend.
---

# FutGestor Development Skill

## About the Project

FutGestor is a multi-tenant SaaS platform built with React, TypeScript, and Supabase for managing amateur soccer teams in Brazil. It handles player registration, monthly fee collection (via Mercado Pago), match scheduling, team statistics, notifications, and support channels.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions + Realtime)
- **Payments**: Mercado Pago SDK (PIX, boleto, cartão)
- **Hosting**: Lovable / Vercel
- **Language**: Portuguese (pt-BR) for all user-facing content

## Architecture Guidelines

### Multi-Tenancy

Every table MUST include a `team_id` column for tenant isolation. All Supabase Row Level Security (RLS) policies must filter by the authenticated user's team membership.

```sql
-- Standard RLS pattern for FutGestor
CREATE POLICY "Users can view own team data"
ON table_name FOR SELECT
USING (team_id IN (
  SELECT team_id FROM team_members
  WHERE user_id = auth.uid()
));
```

### Database Conventions

- Table names: `snake_case` in Portuguese where natural (e.g., `jogadores`, `mensalidades`, `partidas`)
- Always include: `id` (UUID, PK), `team_id` (FK), `created_at`, `updated_at`
- Soft deletes: Use `deleted_at` timestamp instead of hard deletes
- All monetary values stored as `INTEGER` in centavos (R$ 50,00 = 5000)

### Frontend Conventions

- Components in PascalCase: `PlayerCard.tsx`, `MatchSchedule.tsx`
- Pages in kebab-case folders: `pages/team-settings/`
- All UI text in pt-BR
- Use shadcn/ui components with Tailwind
- Toast notifications via `sonner`
- Forms with `react-hook-form` + `zod` validation

### Mercado Pago Integration

- Use PIX as primary payment method
- Webhook endpoint for payment confirmations via Supabase Edge Functions
- Store payment status: `pending`, `approved`, `rejected`, `refunded`
- Reference: See `references/mercado-pago-guide.md` for API patterns

## Instructions

1. **New Features**: Always consider multi-tenancy. Every query must be scoped to `team_id`.
2. **Database Changes**: Write migrations with `up` and `down`. Test RLS policies.
3. **API/Edge Functions**: Use Supabase Edge Functions (Deno). Include proper error handling and CORS headers.
4. **UI Components**: Follow shadcn/ui patterns. All text in pt-BR. Mobile-first responsive design.
5. **Payments**: Never store full card data. Use Mercado Pago tokens. Log all payment events.

## Constraints

- NEVER expose Supabase service_role key in frontend code
- NEVER skip RLS policies on any table
- NEVER store passwords or sensitive payment data in plain text
- All user-facing error messages must be in Portuguese (pt-BR)
- Always validate inputs with Zod schemas before sending to Supabase

## 6. Idioma

- O agente deve sempre responder e planejar em **Português (PT-BR)**.
