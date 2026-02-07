import { Crown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTeamSlug } from "@/hooks/useTeamSlug";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredPlan: string;
  featureName: string;
}

export function UpgradeModal({ open, onOpenChange, requiredPlan, featureName }: UpgradeModalProps) {
  const navigate = useNavigate();
  const { basePath } = useTeamSlug();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Recurso exclusivo do plano {requiredPlan}
          </DialogTitle>
          <DialogDescription>
            {featureName} está disponível apenas no plano{" "}
            <span className="font-semibold">{requiredPlan}</span> ou superior.
            Faça o upgrade para desbloquear.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Voltar
          </Button>
          <Button
            className="flex-1 bg-yellow-500 text-white hover:bg-yellow-600"
            onClick={() => {
              onOpenChange(false);
              navigate(`${basePath}/admin/planos`);
            }}
          >
            <Crown className="mr-2 h-4 w-4" />
            Ver Planos
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
