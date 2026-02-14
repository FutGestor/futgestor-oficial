import { useState } from "react";
import { Star, Check, User, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  useVotar,
  useMeuVoto,
  useContagemVotos,
  useJogadoresPartida,
} from "@/hooks/useVotacaoDestaque";
import { positionLabels, PlayerPosition } from "@/lib/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface VotacaoDestaqueProps {
  resultadoId: string;
}

export function VotacaoDestaque({ resultadoId }: VotacaoDestaqueProps) {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedJogador, setSelectedJogador] = useState<string | null>(null);

  const { data: jogadores, isLoading: loadingJogadores } =
    useJogadoresPartida(resultadoId);
  const { data: meuVoto } = useMeuVoto(resultadoId);
  const { contagem, total } = useContagemVotos(resultadoId);
  const { mutate: votar, isPending: votando } = useVotar();

  const isApproved = profile?.aprovado === true;
  const jaVotou = !!meuVoto;

  // Encontrar o destaque (maior votação)
  const destaque = Object.entries(contagem).reduce<{
    jogadorId: string;
    votos: number;
  } | null>((acc, [jogadorId, votos]) => {
    if (!acc || votos > acc.votos) {
      return { jogadorId, votos };
    }
    return acc;
  }, null);

  const handleVotar = () => {
    if (!selectedJogador) return;
    votar({ resultadoId, jogadorId: selectedJogador });
  };

  // Usuário não logado
  if (!user) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-muted-foreground/30 p-3 text-center text-sm text-muted-foreground">
        <Star className="mx-auto mb-1 h-4 w-4" />
        <span>Faça login para votar no destaque</span>
      </div>
    );
  }

  // Usuário não aprovado
  if (!isApproved) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-muted-foreground/30 p-3 text-center text-sm text-muted-foreground">
        <Star className="mx-auto mb-1 h-4 w-4" />
        <span>Aguarde aprovação para votar no destaque</span>
      </div>
    );
  }

  // Sem jogadores participantes
  if (!loadingJogadores && (!jogadores || jogadores.length === 0)) {
    return null;
  }

  const jogadorDestaque = destaque
    ? jogadores?.find((j) => j.jogador?.id === destaque.jogadorId)?.jogador
    : null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-4">
      {/* Header com destaque atual */}
      <div className="flex flex-wrap items-center gap-2">
        {destaque && jogadorDestaque && (
          <div className="flex items-center gap-2 text-sm">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="font-medium">
              {jogadorDestaque.apelido || jogadorDestaque.nome}
            </span>
            <Badge variant="secondary" className="text-xs">
              {destaque.votos} {destaque.votos === 1 ? "voto" : "votos"}
            </Badge>
          </div>
        )}
        
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-auto shrink-0 gap-1 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            <Star className="h-4 w-4" />
            {jaVotou ? "Alterar Voto" : "Votar Destaque"}
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent className="mt-3">
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="mb-3 text-sm font-medium">
            Selecione o destaque da partida:
          </p>

          {loadingJogadores ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Carregando jogadores...
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {jogadores?.map((item) => {
                const jogador = item.jogador;
                if (!jogador) return null;

                const votos = contagem[jogador.id] || 0;
                const isSelected =
                  selectedJogador === jogador.id ||
                  (!selectedJogador && meuVoto?.jogador_id === jogador.id);
                const isMeuVoto = meuVoto?.jogador_id === jogador.id;

                return (
                  <button
                    key={jogador.id}
                    type="button"
                    onClick={() => setSelectedJogador(jogador.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-transparent bg-background hover:border-muted-foreground/30"
                    )}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={jogador.foto_url || undefined} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {jogador.apelido || jogador.nome}
                        {jogador.numero && (
                          <span className="ml-1 text-muted-foreground">
                            #{jogador.numero}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {positionLabels[jogador.posicao as PlayerPosition]}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {votos > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {votos}
                        </Badge>
                      )}
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                      {isMeuVoto && !isSelected && (
                        <Badge variant="outline" className="text-xs">
                          Seu voto
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {total} {total === 1 ? "voto" : "votos"} no total
            </span>
            <Button
              onClick={handleVotar}
              disabled={!selectedJogador || votando}
              size="sm"
              className="bg-white text-slate-900 hover:bg-white/90"
            >
              {votando ? "Votando..." : jaVotou ? "Atualizar Voto" : "Confirmar Voto"}
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
