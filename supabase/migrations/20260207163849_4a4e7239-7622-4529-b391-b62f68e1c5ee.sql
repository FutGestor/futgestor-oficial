
-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  plano text NOT NULL DEFAULT 'basico',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'pending')),
  mp_subscription_id text,
  mp_preference_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(team_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Team admins can manage their subscription
CREATE POLICY "Team admins can manage subscriptions"
ON public.subscriptions
FOR ALL
USING (is_team_admin(auth.uid(), team_id));

-- Team members can view their team subscription
CREATE POLICY "Team members can view subscription"
ON public.subscriptions
FOR SELECT
USING (team_id = get_user_team_id());

-- Service role can manage all (for webhooks)
CREATE POLICY "Service role full access"
ON public.subscriptions
FOR ALL
USING (true)
WITH CHECK (true);

-- Update trigger
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
