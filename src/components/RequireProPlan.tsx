import { ReactNode } from "react";
import { Crown, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useIsProPlan } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { Link } from "react-router-dom";

interface RequireProPlanProps {
  children: ReactNode;
  featureName?: string;
}

export function RequireProPlan({ children }: RequireProPlanProps) {
  return <>{children}</>;
}
