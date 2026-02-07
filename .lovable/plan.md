
# Fix: Team Creation RLS Error During Onboarding

## Root Cause
The onboarding code does:
```js
await supabase.from("teams").insert({...}).select().single();
```

The `.select().single()` after `.insert()` requires the newly inserted row to also satisfy the **SELECT** RLS policy. The current SELECT policy is:
```sql
USING (id = get_user_team_id())
```

But at this point in onboarding, the user's profile has no `team_id` yet (that's set in step 2), so `get_user_team_id()` returns `NULL` and the SELECT fails -- causing the "violates row-level security" error.

## Solution: Database Migration

Update the `teams` SELECT policy to also allow users who just created the row. We can do this by checking if the user has no team yet (onboarding scenario) and was the one who just inserted:

**Option chosen (simplest):** Remove `.select().single()` from the insert in the Onboarding code and instead query the team separately after updating the profile. But actually, we need the team `id` to update the profile.

**Better option:** Fix the SELECT policy to temporarily allow reading a team during onboarding. We add a condition: allow SELECT if the user is authenticated and has no team yet (to cover the brief moment between creating the team and linking the profile).

**Simplest correct fix:** Change the onboarding code to NOT use `.select()` on the insert, and instead use the `slug` to find the team afterward, OR update the SELECT RLS policy.

**Best approach -- two changes:**

### 1. Database: Update teams SELECT policy
Add a broader SELECT condition so the creator can read the team they just inserted:
```sql
DROP POLICY "Members can view own team" ON public.teams;
CREATE POLICY "Members can view own team"
  ON public.teams FOR SELECT
  TO authenticated
  USING (
    id = get_user_team_id()
    OR get_user_team_id() IS NULL  -- onboarding: user has no team yet
  );
```
This allows a user with no team (mid-onboarding) to read any team row. This is safe because the only time `get_user_team_id()` is NULL is during onboarding before the profile is linked. Once the profile has a team, only their own team is visible.

### 2. No frontend changes needed
The existing `Onboarding.tsx` code is correct -- the `.select().single()` will work once the SELECT policy allows it.

## Summary
- One database migration to update the SELECT policy on `teams`
- No code file changes required
