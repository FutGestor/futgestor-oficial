import { useNavigate } from "react-router-dom";
import { CalendarPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSolicitacoesPendentesCount, useSolicitacoesRealtime } from "@/hooks/useSolicitacoes";
import { useIsTeamAdmin } from "@/hooks/useIsTeamAdmin";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useOptionalTeamSlug } from "@/hooks/useTeamSlug";

/**
 * Componente de alerta flutuante para notificar admins sobre solicitações de jogo pendentes
 * Apenas visível para admins do time
 */
export function SolicitacaoAlert() {
  const navigate = useNavigate();
  const { team } = useTeamConfig();
  const teamSlug = useOptionalTeamSlug();
  const teamId = team?.id;
  const basePath = teamSlug?.basePath || "";
  
  const { data: isAdmin } = useIsTeamAdmin(teamId);
  const { data: pendentesCount = 0 } = useSolicitacoesPendentesCount(teamId);
  
  // Ativar realtime para atualizações instantâneas
  useSolicitacoesRealtime(teamId);
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when count changes
  useEffect(() => {
    if (pendentesCount > 0) {
      setDismissed(false);
    }
  }, [pendentesCount]);

  // Não mostrar se:
  // - Não há time
  // - Usuário não é admin
  // - Não há solicitações pendentes
  // - Usuário dismissou o alerta
  if (!teamId || !isAdmin || pendentesCount === 0 || dismissed) {
    return null;
  }

  const handleClick = () => {
    navigate(`${basePath}/solicitacoes`);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "fixed top-20 right-4 z-50 cursor-pointer",
        "flex items-center gap-3",
        "px-4 py-3 rounded-xl",
        "bg-gradient-to-r from-primary to-primary/90",
        "text-white shadow-lg shadow-primary/30",
        "border border-white/20",
        "animate-in slide-in-from-right-full duration-500",
        "hover:scale-105 hover:shadow-xl hover:shadow-primary/40",
        "transition-all duration-300"
      )}
    >
      {/* Ícone com badge */}
      <div className="relative">
        <div className="p-2 bg-white/20 rounded-lg">
          <CalendarPlus className="h-5 w-5" />
        </div>
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold shadow-md animate-pulse">
          {pendentesCount > 9 ? "9+" : pendentesCount}
        </span>
      </div>

      {/* Texto */}
      <div className="flex flex-col">
        <span className="text-sm font-semibold">
          {pendentesCount === 1 
            ? "Nova solicitação de jogo!" 
            : `${pendentesCount} novas solicitações de jogo!`}
        </span>
        <span className="text-xs text-white/80">
          Clique para visualizar
        </span>
      </div>

      {/* Botão de fechar */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDismiss}
        className="h-7 w-7 rounded-full hover:bg-white/20 text-white/80 hover:text-white ml-2"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
