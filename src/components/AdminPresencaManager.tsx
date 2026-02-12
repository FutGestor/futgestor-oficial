import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, X, Clock, Save, Users, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useJogadores } from "@/hooks/useData";
import { useConfirmacoesJogo, useConfirmacoesContagem, useConfirmarPresenca } from "@/hooks/useConfirmacoes";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import { usePresencaLink, usePresencasViaLink } from "@/hooks/usePresencaLink";
import type { PresenceStatus } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

interface AdminPresencaManagerProps {
  jogoId: string;
}

type StatusMap = Record<string, PresenceStatus | null>;

export default function AdminPresencaManager({ jogoId }: AdminPresencaManagerProps) {
  const { data: jogadores, isLoading: isLoadingJogadores } = useJogadores(true);
  const { data: confirmacoes, isLoading: isLoadingConfirmacoes } = useConfirmacoesJogo(jogoId);
  const { data: contagem } = useConfirmacoesContagem(jogoId);
  const { link } = usePresencaLink(jogoId);
  const { data: presencasViaLink } = usePresencasViaLink(link?.id);
  const [statusMap, setStatusMap] = useState<StatusMap>({});
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  // const { profile } = useAuth(); // Not needed if we use team from useTeamConfig
  const { team } = useTeamConfig();
  const confirmarPresenca = useConfirmarPresenca();

  const isLoading = isLoadingJogadores || isLoadingConfirmacoes;

  const getCurrentStatus = (jogadorId: string): PresenceStatus | null => {
    if (statusMap[jogadorId] !== undefined) return statusMap[jogadorId];
    const confirmacao = confirmacoes?.find(c => c.jogador_id === jogadorId);
    return confirmacao?.status ?? null;
  };

  const handleStatusChange = (jogadorId: string, status: string) => {
    setStatusMap(prev => ({ ...prev, [jogadorId]: status as PresenceStatus | null }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = Object.entries(statusMap).map(async ([jogadorId, status]) => {
        if (status === null || !team.id) return;
        return confirmarPresenca.mutateAsync({
          jogoId,
          jogadorId,
          status,
          teamId: team.id,
        });
      });

      await Promise.all(updates);
      setStatusMap({});
      queryClient.invalidateQueries({ queryKey: ["confirmacoes-jogo", jogoId] });
      queryClient.invalidateQueries({ queryKey: ["confirmacoes-contagem", jogoId] });
      toast({ title: "Presenças atualizadas com sucesso!" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao salvar presenças", description: error instanceof Error ? error.message : "Ocorreu um erro" });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = Object.keys(statusMap).length > 0;

  // Link-based presence stats
  const linkConfirmados = presencasViaLink?.filter(p => p.status === "confirmado").length || 0;
  const linkAusentes = presencasViaLink?.filter(p => p.status === "ausente").length || 0;
  const linkPendentes = (jogadores?.length || 0) - linkConfirmados - linkAusentes;

  const getLinkStatus = (jogadorId: string) => presencasViaLink?.find(p => p.jogador_id === jogadorId)?.status || null;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  if (!jogadores || jogadores.length === 0) {
    return (
      <div className="py-6 text-center text-muted-foreground">
        <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
        <p>Nenhum jogador cadastrado</p>
      </div>
    );
  }

  const renderPlayerList = (getStatus: (id: string) => string | null, interactive: boolean) => (
    <ScrollArea className="h-[300px]">
      <div className="space-y-2">
        {jogadores.map((jogador) => {
          const currentStatus = interactive ? getCurrentStatus(jogador.id) : getStatus(jogador.id);
          const hasLocalChange = interactive && statusMap[jogador.id] !== undefined;

          return (
            <Card key={jogador.id} className={hasLocalChange ? "border-yellow-400 bg-yellow-50/50 dark:bg-yellow-950/20" : ""}>
              <CardContent className="flex items-center justify-between gap-2 p-3">
                <div className="flex items-center gap-2">
                  {jogador.foto_url ? (
                    <img src={jogador.foto_url} alt={jogador.nome} className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {(jogador.apelido || jogador.nome).charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{jogador.apelido || jogador.nome}</p>
                    <p className="text-xs text-muted-foreground capitalize">{jogador.posicao}</p>
                  </div>
                </div>

                {interactive ? (
                  <ToggleGroup type="single" value={currentStatus || ""} onValueChange={(v) => handleStatusChange(jogador.id, v)} className="gap-1">
                    <ToggleGroupItem value="confirmado" aria-label="Confirmado" className="h-8 w-8 data-[state=on]:bg-green-100 data-[state=on]:text-green-700 dark:data-[state=on]:bg-green-900 dark:data-[state=on]:text-green-300">
                      <Check className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="indisponivel" aria-label="Indisponível" className="h-8 w-8 data-[state=on]:bg-red-100 data-[state=on]:text-red-700 dark:data-[state=on]:bg-red-900 dark:data-[state=on]:text-red-300">
                      <X className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="pendente" aria-label="Pendente" className="h-8 w-8 data-[state=on]:bg-muted">
                      <Clock className="h-4 w-4" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                ) : (
                  <Badge variant={currentStatus === "confirmado" ? "default" : currentStatus === "ausente" ? "destructive" : "secondary"} className="gap-1">
                    {currentStatus === "confirmado" ? <Check className="h-3 w-3" /> : currentStatus === "ausente" ? <X className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {currentStatus === "confirmado" ? "Confirmado" : currentStatus === "ausente" ? "Ausente" : "Sem resposta"}
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );

  return (
    <Tabs defaultValue={presencasViaLink && presencasViaLink.length > 0 ? "link" : "admin"}>
      <TabsList className="w-full">
        <TabsTrigger value="admin" className="flex-1 gap-1">
          <Users className="h-3 w-3" /> Admin
        </TabsTrigger>
        <TabsTrigger value="link" className="flex-1 gap-1">
          <Link2 className="h-3 w-3" /> Via Link
          {presencasViaLink && presencasViaLink.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1 text-xs">{presencasViaLink.length}</Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="admin" className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="default" className="gap-1"><Check className="h-3 w-3" />{contagem?.confirmados || 0} confirmados</Badge>
          <Badge variant="destructive" className="gap-1"><X className="h-3 w-3" />{contagem?.indisponiveis || 0} indisponíveis</Badge>
          <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />{contagem?.pendentes || 0} pendentes</Badge>
        </div>
        {renderPlayerList(() => null, true)}
        <Button onClick={handleSave} disabled={!hasChanges || isSaving} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </TabsContent>

      <TabsContent value="link" className="space-y-4">
        {!link ? (
          <div className="py-6 text-center text-muted-foreground">
            <Link2 className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>Nenhum link de presença gerado para este jogo.</p>
            <p className="text-xs">Use o botão de link no card do jogo para gerar.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default" className="gap-1"><Check className="h-3 w-3" />{linkConfirmados} confirmados</Badge>
              <Badge variant="destructive" className="gap-1"><X className="h-3 w-3" />{linkAusentes} ausentes</Badge>
              <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />{linkPendentes} sem resposta</Badge>
            </div>
            {renderPlayerList(getLinkStatus, false)}
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}
