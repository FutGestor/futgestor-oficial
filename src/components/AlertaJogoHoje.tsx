import { useEffect } from "react";
import { AlertTriangle, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useJogosHojeSemEscalacao, useMarcarNotificacaoLida } from "@/hooks/useNotificacoesPush";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function AlertaJogoHoje() {
  const { team } = useTeamConfig();
  const navigate = useNavigate();
  const { data: jogosHoje, isLoading } = useJogosHojeSemEscalacao(team.id);
  const marcarLida = useMarcarNotificacaoLida();

  if (isLoading || !jogosHoje || jogosHoje.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {jogosHoje.map((jogo) => {
        const hora = format(new Date(jogo.data_hora), "HH:mm", { locale: ptBR });
        const temEscalacao = jogo.escalacoes && jogo.escalacoes.length > 0;
        const statusEscalacao = jogo.escalacoes?.[0]?.status_escalacao;

        return (
          <Alert 
            key={jogo.id} 
            className={cn(
              "border-l-4",
              !temEscalacao || statusEscalacao === 'provavel'
                ? "bg-amber-500/10 border-amber-500/50 border-l-amber-500"
                : "bg-green-500/10 border-green-500/50 border-l-green-500"
            )}
          >
            <Calendar className={cn(
              "h-4 w-4",
              !temEscalacao || statusEscalacao === 'provavel'
                ? "text-amber-500"
                : "text-green-500"
            )} />
            <AlertTitle className="flex items-center gap-2">
              <span>Hoje: vs {jogo.adversario}</span>
              <span className="text-xs text-muted-foreground">às {hora}</span>
            </AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>
                {!temEscalacao 
                  ? "Escalação não criada ainda."
                  : statusEscalacao === 'provavel'
                    ? `Escalação provável criada. Finalize após confirmações.`
                    : `Escalação confirmada!`
                }
              </span>
              <Button 
                size="sm" 
                variant={!temEscalacao || statusEscalacao === 'provavel' ? "default" : "outline"}
                className="shrink-0"
                onClick={() => navigate(`/admin/escalacoes?jogo=${jogo.id}`)}
              >
                {!temEscalacao || statusEscalacao === 'provavel' ? (
                  <>
                    Finalizar Escalação
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                ) : (
                  "Ver Escalação"
                )}
              </Button>
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}

// Import cn
import { cn } from "@/lib/utils";
