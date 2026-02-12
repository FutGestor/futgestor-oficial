-- Add bio_config column to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS bio_config JSONB DEFAULT '{
  "text": null,
  "color": "#FFFFFF",
  "fontSize": "1.125rem",
  "fontWeight": "400",
  "textAlign": "center"
}'::JSONB;

-- Comment on column
COMMENT ON COLUMN teams.bio_config IS 'Stores public page bio text and styling configuration';
