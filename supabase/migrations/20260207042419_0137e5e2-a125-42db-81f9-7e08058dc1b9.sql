-- Fix: user_roles com team_id NULL
UPDATE public.user_roles 
SET team_id = (SELECT team_id FROM public.profiles WHERE id = user_roles.user_id)
WHERE team_id IS NULL;