import { useState, useEffect, useMemo } from "react";
import { User, Star, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useJogadores } from "@/hooks/useData";
import { useEstatisticasPartida, useSaveEstatisticasPartida } from "@/hooks/useEstatisticas";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type JogadorStats = {
  jogador_id: string;
  participou: boolean;
  gols: number;
  assistencias: number;
  cartao_amarelo: boolean;
  cartao_vermelho: boolean;
};

interface EstatisticasPartidaFormProps {
  resultadoId: string;
  onSave?: () => void;
}

export default function EstatisticasPartidaForm({ resultadoId, onSave }: EstatisticasPartidaFormProps) {
  const [stats, setStats] = useState<Record<string, JogadorStats>>({});
  const [mvpJogadorId, setMvpJogadorId] = useState<string>("");

  const { profile } = useAuth();
  const { data: jogadores, isLoading: jogadoresLoading } = useJogadores(true, profile?.team_id);
  const { data: estatisticasExistentes, isLoading: estatisticasLoading } = useEstatisticasPartida(resultadoId);
  const saveEstatisticas = useSaveEstatisticasPartida();
  const { toast } = useToast();

  const jogadoresAtivos = jogadores?.filter(j => j.ativo !== false) || [];

  // Carregar MVP existente
  useEffect(() => {
    if (!resultadoId) return;
    supabase
      .from("resultados")
      .select("mvp_jogador_id")
      .eq("id", resultadoId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.mvp_jogador_id) setMvpJogadorId(data.mvp_jogador_id);
      });
  }, [resultadoId]);

  // Inicializar stats quando jogadores ou estatísticas carregarem
  useEffect(() => {
    if (!jogadoresAtivos.length) return;

    const initialStats: Record<string, JogadorStats> = {};

    for (const jogador of jogadoresAtivos) {
      const existente = estatisticasExistentes?.find(e => e.jogador_id === jogador.id);

      initialStats[jogador.id] = existente
        ? {
          jogador_id: jogador.id,
          participou: existente.participou,
          gols: existente.gols,
          assistencias: existente.assistencias,
          cartao_amarelo: existente.cartao_amarelo,
          cartao_vermelho: existente.cartao_vermelho,
        }
        : {
          jogador_id: jogador.id,
          participou: false,
          gols: 0,
          assistencias: 0,
          cartao_amarelo: false,
          cartao_vermelho: false,
        };
    }

    setStats(initialStats);
  }, [jogadoresAtivos, estatisticasExistentes]);

  const updateStats = (jogadorId: string, field: keyof JogadorStats, value: boolean | number) => {
    setStats(prev => ({
      ...prev,
      [jogadorId]: {
        ...prev[jogadorId],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      const estatisticasParaSalvar = Object.values(stats).filter(s => s.participou);

      if (estatisticasParaSalvar.length === 0) {
        if (!confirm("Nenhum jogador foi marcado como participante. Isso impedirá a votação do Craque da Galera.\n\nDeseja salvar mesmo assim?")) {
          return;
        }
      }

      await saveEstatisticas.mutateAsync({
        resultadoId,
        estatisticas: estatisticasParaSalvar,
        team_id: profile?.team_id,
      });

      // Salvar MVP
      await supabase
        .from("resultados")
        .update({ mvp_jogador_id: (mvpJogadorId && mvpJogadorId !== "none") ? mvpJogadorId : null } as any)
        .eq("id", resultadoId);

      toast({ title: "Estatísticas salvas com sucesso!" });
      onSave?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar estatísticas",
        description: error instanceof Error ? error.message : "Tente novamente",
      });
    }
  };

  const participantes = Object.values(stats).filter(s => s.participou).length;
  const totalGols = Object.values(stats).reduce((sum, s) => sum + s.gols, 0);

  if (jogadoresLoading || estatisticasLoading) {
    return <div className="py-8 text-center text-muted-foreground">Carregando jogadores...</div>;
  }

  const participantes_list = jogadoresAtivos.filter(j => stats[j.id]?.participou);

  return (
    <div className="space-y-4">
      <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-900/50 dark:text-yellow-200">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Importante!</AlertTitle>
        <AlertDescription>
          Para que a votação do <strong>Craque da Galera</strong> funcione, você deve marcar abaixo quem <strong>Participou</strong> da partida.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{participantes} jogador(es) participaram</span>
        <span>{totalGols} gol(s) marcado(s)</span>
      </div>

      {/* Seleção de MVP */}
      <Card className="border-yellow-500/50">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <Label className="font-medium">MVP da Partida</Label>
          </div>
          <Select value={mvpJogadorId} onValueChange={setMvpJogadorId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o destaque da partida" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {participantes_list.map(j => (
                <SelectItem key={j.id} value={j.id}>
                  {j.apelido || j.nome} {j.numero ? `#${j.numero}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <ScrollArea className="h-[350px] pr-4">
        <div className="space-y-3">
          {jogadoresAtivos.map(jogador => {
            const jogadorStats = stats[jogador.id];
            if (!jogadorStats) return null;

            return (
              <Card 
                key={jogador.id} 
                className={cn(
                  "transition-all duration-200",
                  jogadorStats.participou 
                    ? "border-primary shadow-md bg-primary/5 dark:bg-primary/10" 
                    : "border-border opacity-80"
                )}
              >
                <CardContent className="p-3">
                  <div className="flex flex-col gap-3">
                    {/* Header com checkbox e nome */}
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`participou-${jogador.id}`}
                        checked={jogadorStats.participou}
                        onCheckedChange={(checked) => updateStats(jogador.id, "participou", !!checked)}
                      />
                      <div className="flex items-center gap-2 flex-1">
                        {jogador.foto_url ? (
                          <img
                            src={jogador.foto_url}
                            alt={jogador.nome}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            <User className="h-4 w-4" />
                          </div>
                        )}
                        <Label
                          htmlFor={`participou-${jogador.id}`}
                          className="flex-1 font-medium cursor-pointer"
                        >
                          {jogador.apelido || jogador.nome}
                          {jogador.numero && <span className="ml-1 text-muted-foreground">#{jogador.numero}</span>}
                        </Label>
                      </div>
                    </div>

                    {/* Stats (só aparece se participou) */}
                    {jogadorStats.participou && (
                      <div className="ml-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Gols</Label>
                          <Input
                            type="number"
                            min="0"
                            value={jogadorStats.gols}
                            onChange={(e) => updateStats(jogador.id, "gols", parseInt(e.target.value) || 0)}
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Assists</Label>
                          <Input
                            type="number"
                            min="0"
                            value={jogadorStats.assistencias}
                            onChange={(e) => updateStats(jogador.id, "assistencias", parseInt(e.target.value) || 0)}
                            className="h-8"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`amarelo-${jogador.id}`}
                            checked={jogadorStats.cartao_amarelo}
                            onCheckedChange={(checked) => updateStats(jogador.id, "cartao_amarelo", !!checked)}
                          />
                          <Label htmlFor={`amarelo-${jogador.id}`} className="text-xs cursor-pointer">
                            🟨 Amarelo
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`vermelho-${jogador.id}`}
                            checked={jogadorStats.cartao_vermelho}
                            onCheckedChange={(checked) => updateStats(jogador.id, "cartao_vermelho", !!checked)}
                          />
                          <Label htmlFor={`vermelho-${jogador.id}`} className="text-xs cursor-pointer">
                            🟥 Vermelho
                          </Label>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      <Button
        onClick={handleSave}
        disabled={saveEstatisticas.isPending}
        className="w-full"
      >
        {saveEstatisticas.isPending ? "Salvando..." : "Salvar Estatísticas"}
      </Button>
    </div>
  );
}
