-- Atualizar função handle_new_user para incluir nome do metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, aprovado, nome)
  VALUES (NEW.id, false, NULLIF(NEW.raw_user_meta_data->>'nome', ''));
  RETURN NEW;
END;
$function$;