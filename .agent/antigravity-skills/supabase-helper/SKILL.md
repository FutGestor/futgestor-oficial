---
name: supabase-helper
description: Use this skill when working with Supabase in any project. Triggers include creating tables, writing RLS policies, building Edge Functions, configuring Auth, using Supabase Storage, writing database migrations, or debugging Supabase-related issues. Also use for Supabase CLI commands, realtime subscriptions, or connecting Supabase with React/TypeScript frontends.
---

# Supabase Development Helper

## Quick Reference

### Supabase Client Setup (React + TypeScript)

```typescript
// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### Common Query Patterns

```typescript
// SELECT with filters
const { data, error } = await supabase
  .from("table")
  .select("*, related_table(*)")
  .eq("column", value)
  .order("created_at", { ascending: false })
  .limit(20);

// INSERT
const { data, error } = await supabase
  .from("table")
  .insert({ column: value })
  .select()
  .single();

// UPDATE
const { data, error } = await supabase
  .from("table")
  .update({ column: newValue })
  .eq("id", recordId)
  .select()
  .single();

// UPSERT
const { data, error } = await supabase
  .from("table")
  .upsert({ id: existingId, column: value })
  .select()
  .single();

// DELETE (soft delete pattern)
const { error } = await supabase
  .from("table")
  .update({ deleted_at: new Date().toISOString() })
  .eq("id", recordId);

// Realtime subscription
const channel = supabase
  .channel("custom-channel")
  .on("postgres_changes",
    { event: "*", schema: "public", table: "messages" },
    (payload) => console.log(payload)
  )
  .subscribe();
```

### Edge Function Template

```typescript
// supabase/functions/my-function/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase.from("table").select("*");
    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

### Migration Template

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_description.sql

-- UP
CREATE TABLE IF NOT EXISTS public.new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.new_table
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## Instructions

1. **Always enable RLS** on every new table
2. **Always add updated_at triggers** for tables that will be edited
3. **Use gen_random_uuid()** for primary keys (not uuid_generate_v4)
4. **Type-safe queries**: Generate types with `supabase gen types typescript`
5. **Error handling**: Always check for errors in Supabase responses
6. **Edge Functions**: Always include CORS headers

## Constraints

- NEVER use `supabase.auth.admin` methods in frontend code
- NEVER expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code
- NEVER create tables without RLS enabled
- Always use parameterized queries (Supabase client handles this)
- Prefer `select().single()` when expecting one row
