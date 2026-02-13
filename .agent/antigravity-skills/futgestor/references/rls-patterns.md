# Supabase RLS Patterns - FutGestor

## Standard Team-Scoped Policy

```sql
-- SELECT: members can read their team's data
CREATE POLICY "team_read" ON {table}
FOR SELECT USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
);

-- INSERT: members can insert for their team
CREATE POLICY "team_insert" ON {table}
FOR INSERT WITH CHECK (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
);

-- UPDATE: only admins can update
CREATE POLICY "team_admin_update" ON {table}
FOR UPDATE USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
  )
);

-- DELETE: only owners can delete
CREATE POLICY "team_owner_delete" ON {table}
FOR DELETE USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);
```

## Roles Hierarchy

| Role    | View | Create | Edit | Delete | Manage Team |
|---------|------|--------|------|--------|-------------|
| owner   | ✅   | ✅     | ✅   | ✅     | ✅          |
| admin   | ✅   | ✅     | ✅   | ❌     | ❌          |
| member  | ✅   | ❌     | ❌   | ❌     | ❌          |

## Core Tables That Need RLS

- `teams` - team details
- `team_members` - membership and roles
- `jogadores` - player profiles
- `mensalidades` - monthly fees
- `partidas` - matches
- `financeiro` - financial records
- `notifications` - team notifications
