import { Check, X, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirmacoesJogo, useConfirmacoesContagem } from "@/hooks/useConfirmacoes";

interface ConfirmacoesJogoViewProps {
  jogoId: string;
}

export default function ConfirmacoesJogoView({ jogoId }: ConfirmacoesJogoViewProps) {
  const { data: confirmacoes, isLoading } = useConfirmacoesJogo(jogoId);
  const { data: contagem } = useConfirmacoesContagem(jogoId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  const confirmados = confirmacoes?.filter(c => c.status === "confirmado") || [];
  const indisponiveis = confirmacoes?.filter(c => c.status === "indisponivel") || [];
  const pendentes = confirmacoes?.filter(c => c.status === "pendente") || [];

  if (!confirmacoes || confirmacoes.length === 0) {
    return (
      <div className="py-6 text-center text-muted-foreground">
        <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
        <p>Nenhuma confirmação registrada</p>
        <p className="text-sm">Os jogadores podem confirmar presença na Agenda</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="flex gap-2 flex-wrap">
        <Badge variant="default" className="gap-1">
          <Check className="h-3 w-3" />
          {contagem?.confirmados || 0} confirmados
        </Badge>
        <Badge variant="destructive" className="gap-1">
          <X className="h-3 w-3" />
          {contagem?.indisponiveis || 0} indisponíveis
        </Badge>
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          {contagem?.pendentes || 0} pendentes
        </Badge>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="space-y-4">
          {/* Confirmados */}
          {confirmados.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-green-600">
                <Check className="h-4 w-4" />
                Confirmados ({confirmados.length})
              </h4>
              <div className="space-y-1">
                {confirmados.map(c => (
                  <Card key={c.id} className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
                    <CardContent className="flex items-center gap-2 p-2">
                      {c.jogador?.foto_url ? (
                        <img 
                          src={c.jogador.foto_url} 
                          alt={c.jogador.nome} 
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-200 text-xs font-medium">
                          {(c.jogador?.apelido || c.jogador?.nome || "?").charAt(0)}
                        </div>
                      )}
                      <span className="text-sm font-medium">
                        {c.jogador?.apelido || c.jogador?.nome}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Indisponíveis */}
          {indisponiveis.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-destructive">
                <X className="h-4 w-4" />
                Indisponíveis ({indisponiveis.length})
              </h4>
              <div className="space-y-1">
                {indisponiveis.map(c => (
                  <Card key={c.id} className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
                    <CardContent className="flex items-center gap-2 p-2">
                      {c.jogador?.foto_url ? (
                        <img 
                          src={c.jogador.foto_url} 
                          alt={c.jogador.nome} 
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-200 text-xs font-medium">
                          {(c.jogador?.apelido || c.jogador?.nome || "?").charAt(0)}
                        </div>
                      )}
                      <span className="text-sm font-medium">
                        {c.jogador?.apelido || c.jogador?.nome}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Pendentes */}
          {pendentes.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="h-4 w-4" />
                Aguardando resposta ({pendentes.length})
              </h4>
              <div className="space-y-1">
                {pendentes.map(c => (
                  <Card key={c.id}>
                    <CardContent className="flex items-center gap-2 p-2">
                      {c.jogador?.foto_url ? (
                        <img 
                          src={c.jogador.foto_url} 
                          alt={c.jogador.nome} 
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {(c.jogador?.apelido || c.jogador?.nome || "?").charAt(0)}
                        </div>
                      )}
                      <span className="text-sm font-medium">
                        {c.jogador?.apelido || c.jogador?.nome}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
