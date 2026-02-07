-- Create trigger for automatic profile creation on signup
-- The function already exists, just need to ensure the trigger is attached
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END;
$$;