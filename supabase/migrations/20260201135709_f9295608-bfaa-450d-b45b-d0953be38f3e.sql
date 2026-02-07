-- Add nome column to profiles
ALTER TABLE public.profiles ADD COLUMN nome text;

-- Delete test users from auth.users (this will cascade to profiles)
DELETE FROM auth.users 
WHERE id = 'a67602dd-6032-4af2-90f3-5cf93db7a915';