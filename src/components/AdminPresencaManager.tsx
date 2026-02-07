import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, X, Clock, Save, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useJogadores } from "@/hooks/useData";
import { useConfirmacoesJogo, useConfirmacoesContagem } from "@/hooks/useConfirmacoes";
import type { PresenceStatus } from "@/lib/types";

interface AdminPresencaManagerProps {
  jogoId: string;
}

type StatusMap = Record<string, PresenceStatus | null>;

export default function AdminPresencaManager({ jogoId }: AdminPresencaManagerProps) {
  const { data: jogadores, isLoading: isLoadingJogadores } = useJogadores(true);
  const { data: confirmacoes, isLoading: isLoadingConfirmacoes } = useConfirmacoesJogo(jogoId);
  const { data: contagem } = useConfirmacoesContagem(jogoId);
  const [statusMap, setStatusMap] = useState<StatusMap>({});
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isLoading = isLoadingJogadores || isLoadingConfirmacoes;

  // Obter o status atual de um jogador
  const getCurrentStatus = (jogadorId: string): PresenceStatus | null => {
    // Primeiro verificar se há alteração local
    if (statusMap[jogadorId] !== undefined) {
      return statusMap[jogadorId];
    }
    // Depois verificar confirmação existente
    const confirmacao = confirmacoes?.find(c => c.jogador_id === jogadorId);
    return confirmacao?.status ?? null;
  };

  const handleStatusChange = (jogadorId: string, status: string) => {
    setStatusMap(prev => ({
      ...prev,
      [jogadorId]: status as PresenceStatus | null,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Processar cada alteração
      for (const [jogadorId, status] of Object.entries(statusMap)) {
        if (status === null) continue;
        
        const existingConfirmacao = confirmacoes?.find(c => c.jogador_id === jogadorId);
        
        if (existingConfirmacao) {
          // Atualizar confirmação existente
          const { error } = await supabase
            .from("confirmacoes_presenca")
            .update({ status })
            .eq("id", existingConfirmacao.id);
          
          if (error) throw error;
        } else {
          // Criar nova confirmação
          const { error } = await supabase
            .from("confirmacoes_presenca")
            .insert({
              jogo_id: jogoId,
              jogador_id: jogadorId,
              status,
            });
          
          if (error) throw error;
        }
      }

      // Limpar alterações locais e atualizar cache
      setStatusMap({});
      queryClient.invalidateQueries({ queryKey: ["confirmacoes-jogo", jogoId] });
      queryClient.invalidateQueries({ queryKey: ["confirmacoes-contagem", jogoId] });
      
      toast({ title: "Presenças atualizadas com sucesso!" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar presenças",
        description: error instanceof Error ? error.message : "Ocorreu um erro",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = Object.keys(statusMap).length > 0;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
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

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="flex flex-wrap gap-2">
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

      <ScrollArea className="h-[350px]">
        <div className="space-y-2">
          {jogadores.map((jogador) => {
            const currentStatus = getCurrentStatus(jogador.id);
            const hasLocalChange = statusMap[jogador.id] !== undefined;
            
            return (
              <Card 
                key={jogador.id} 
                className={hasLocalChange ? "border-yellow-400 bg-yellow-50/50 dark:bg-yellow-950/20" : ""}
              >
                <CardContent className="flex items-center justify-between gap-2 p-3">
                  <div className="flex items-center gap-2">
                    {jogador.foto_url ? (
                      <img
                        src={jogador.foto_url}
                        alt={jogador.nome}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                        {(jogador.apelido || jogador.nome).charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {jogador.apelido || jogador.nome}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {jogador.posicao}
                      </p>
                    </div>
                  </div>
                  
                  <ToggleGroup 
                    type="single" 
                    value={currentStatus || ""} 
                    onValueChange={(value) => handleStatusChange(jogador.id, value)}
                    className="gap-1"
                  >
                    <ToggleGroupItem 
                      value="confirmado" 
                      aria-label="Confirmado"
                      className="h-8 w-8 data-[state=on]:bg-green-100 data-[state=on]:text-green-700 dark:data-[state=on]:bg-green-900 dark:data-[state=on]:text-green-300"
                    >
                      <Check className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="indisponivel" 
                      aria-label="Indisponível"
                      className="h-8 w-8 data-[state=on]:bg-red-100 data-[state=on]:text-red-700 dark:data-[state=on]:bg-red-900 dark:data-[state=on]:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="pendente" 
                      aria-label="Pendente"
                      className="h-8 w-8 data-[state=on]:bg-muted"
                    >
                      <Clock className="h-4 w-4" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* Botão Salvar */}
      <Button 
        onClick={handleSave} 
        disabled={!hasChanges || isSaving}
        className="w-full"
      >
        <Save className="mr-2 h-4 w-4" />
        {isSaving ? "Salvando..." : "Salvar Alterações"}
      </Button>
    </div>
  );
}
