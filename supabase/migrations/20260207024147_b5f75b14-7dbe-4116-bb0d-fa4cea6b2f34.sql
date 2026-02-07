
-- Add social media links to times table
ALTER TABLE public.times ADD COLUMN redes_sociais jsonb DEFAULT '{}';
COMMENT ON COLUMN public.times.redes_sociais IS 'JSON with social media links: {instagram: "url", whatsapp: "url", etc}';
