import { useState, useMemo, useEffect, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, MapPin, Clock, Users, Shield, 
  ChevronRight, Sparkles, Check, AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SocietyField } from "@/components/SocietyField";
import { DatePickerPopover } from "@/components/ui/date-picker-popover";
import { TimePickerSelect } from "@/components/ui/time-picker-select";
import { useToast } from "@/hooks/use-toast";
import { useJogadores } from "@/hooks/useData";
import { useTimesAtivos } from "@/hooks/useTimes";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import { supabase } from "@/integrations/supabase/client";
import { useSugestaoEscalacao, sugerirEscalacaoInteligente } from "@/hooks/useMLEscalacao";
import { useConfirmacoesContagem } from "@/hooks/useConfirmacoes";
import {
  modalityLabels,
  formacoesPorModalidade,
  positionSlotsByFormation,
  positionSlotLabels,
  positionLabels,
  type GameModality,
  type Jogador,
} from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Types
interface JogoFormData {
  data_hora: string;
  local: string;
  adversario: string;
  tipo_jogo: "amistoso" | "campeonato" | "treino";
  mando: "mandante" | "visitante" | "neutro";
  observacoes: string;
  time_adversario_id?: string | null;
}

interface EscalacaoFormData {
  criarEscalacao: boolean;
  formacao: string;
  modalidade: GameModality;
  publicada: boolean;
  jogadores_por_posicao: Record<string, string>;
  posicoes_customizadas: Record<string, string>;
  banco: string[];
}

interface JogoFormComEscalacaoProps {
  initialJogoData?: Partial<JogoFormData>;
  initialEscalacaoData?: Partial<EscalacaoFormData>;
  jogoId?: string; // Se for edição
  onSubmit: (data: {
    jogo: JogoFormData;
    escalacao?: EscalacaoFormData;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  // Props para controle externo do estado (opcional)
  escalacaoData?: EscalacaoFormData;
  onEscalacaoChange?: (data: EscalacaoFormData) => void;
}

// Componente auxiliar para botão de seleção de jogador
function JogadorSelecaoButton({ 
  jogador, 
  isSelected, 
  onClick,
  isConfirmed,
}: { 
  jogador: Jogador; 
  isSelected: boolean; 
  onClick: () => void;
  isConfirmed?: boolean;
}) {
  return (
    <Button
      variant={isSelected ? "default" : "ghost"}
      className={cn(
        "w-full justify-start gap-3 h-auto py-2",
        isConfirmed && !isSelected && "border-l-2 border-green-500"
      )}
      onClick={onClick}
    >
      {jogador.foto_url ? (
        <img src={jogador.foto_url} alt="" className="w-10 h-10 rounded-full object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-sm font-bold">
          {jogador.numero || "?"}
        </div>
      )}
      <div className="flex flex-col items-start flex-1 min-w-0">
        <span className="font-medium truncate">
          {jogador.apelido || jogador.nome}
          {isConfirmed && (
            <span className="ml-1 text-green-500 text-xs">✓</span>
          )}
        </span>
        <span className="text-xs text-muted-foreground">{positionLabels[jogador.posicao]}</span>
      </div>
      {jogador.numero && (
        <Badge variant="outline" className="ml-auto shrink-0">#{jogador.numero}</Badge>
      )}
    </Button>
  );
}

export function JogoFormComEscalacao({
  initialJogoData,
  initialEscalacaoData,
  jogoId,
  onSubmit,
  onCancel,
  isSubmitting,
  escalacaoData: externalEscalacaoData,
  onEscalacaoChange,
}: JogoFormComEscalacaoProps) {
  const { toast } = useToast();
  const { team } = useTeamConfig();
  const { data: jogadores } = useJogadores(team.id);
  const { data: times } = useTimesAtivos(team.id);
  const { data: confirmacoes } = useConfirmacoesContagem(jogoId);
  
  // Tabs state
  const [activeTab, setActiveTab] = useState("jogo");
  
  // Jogo form state
  const [jogoData, setJogoData] = useState<JogoFormData>({
    data_hora: initialJogoData?.data_hora || "",
    local: initialJogoData?.local || "",
    adversario: initialJogoData?.adversario || "",
    tipo_jogo: initialJogoData?.tipo_jogo || "amistoso",
    mando: initialJogoData?.mando || "mandante",
    observacoes: initialJogoData?.observacoes || "",
  });
  
  // Time adversário selecionado - inicializa com o valor do jogo sendo editado
  const [timeAdversarioId, setTimeAdversarioId] = useState<string>(() => {
    // Se tem time_adversario_id nos dados iniciais, usa ele
    if (initialJogoData?.time_adversario_id) {
      return initialJogoData.time_adversario_id;
    }
    // Se não tem time_adversario_id mas tem adversário (nome manual), usa "manual"
    return "manual";
  });
  
  // Estado interno (usado apenas se não houver controle externo)
  const [internalEscalacaoData, setInternalEscalacaoData] = useState<EscalacaoFormData>(() => ({
    criarEscalacao: initialEscalacaoData?.criarEscalacao ?? true,
    formacao: initialEscalacaoData?.formacao || "2-2-2",
    modalidade: initialEscalacaoData?.modalidade || "society-6",
    publicada: initialEscalacaoData?.publicada || false,
    jogadores_por_posicao: initialEscalacaoData?.jogadores_por_posicao || {},
    posicoes_customizadas: initialEscalacaoData?.posicoes_customizadas || {},
    banco: initialEscalacaoData?.banco || [],
  }));
  
  // Time adversário externo (quando é um time de outro clube, não está na lista local)
  const [timeAdversarioExterno, setTimeAdversarioExterno] = useState<{id: string; nome: string; escudo_url?: string} | null>(null);
  
  // Buscar dados do time adversário externo se necessário
  useEffect(() => {
    const fetchTimeExterno = async () => {
      if (timeAdversarioId && timeAdversarioId !== "manual") {
        // Verificar se o time está na lista local
        const timeLocal = times?.find(t => t.id === timeAdversarioId);
        if (!timeLocal) {
          // Time não está na lista local, buscar dados
          const { data } = await supabase
            .from("times")
            .select("id, nome, escudo_url")
            .eq("id", timeAdversarioId)
            .single();
          if (data) {
            setTimeAdversarioExterno(data);
          }
        }
      }
    };
    fetchTimeExterno();
  }, [timeAdversarioId, times]);

  // Usar estado externo se disponível, senão usar interno
  const escalacaoData = externalEscalacaoData ?? internalEscalacaoData;
  const setEscalacaoData = (updater: EscalacaoFormData | ((prev: EscalacaoFormData) => EscalacaoFormData)) => {
    const newData = typeof updater === 'function' 
      ? (updater as (prev: EscalacaoFormData) => EscalacaoFormData)(escalacaoData)
      : updater;
    
    if (onEscalacaoChange) {
      onEscalacaoChange(newData);
    } else {
      setInternalEscalacaoData(newData);
    }
  };
  
  // Quick select dialog state
  const [quickSelectPosicao, setQuickSelectPosicao] = useState<string | null>(null);
  const [filtroPosicao, setFiltroPosicao] = useState<string>("todas");
  
  // Valor de exibição do Select de adversário
  const adversarioSelectValue = useMemo(() => {
    if (timeAdversarioId === "manual") return "Digitar manualmente";
    if (timeAdversarioExterno?.id === timeAdversarioId) {
      return (
        <div className="flex items-center gap-2">
          {timeAdversarioExterno.escudo_url && (
            <img src={timeAdversarioExterno.escudo_url} alt="" className="w-5 h-5 rounded-full object-cover" />
          )}
          <span>{timeAdversarioExterno.nome}</span>
          <Badge variant="secondary" className="text-[10px]">Vinculado</Badge>
        </div>
      );
    }
    const timeLocal = times?.find(t => t.id === timeAdversarioId);
    if (timeLocal) {
      return (
        <div className="flex items-center gap-2">
          {timeLocal.escudo_url && (
            <img src={timeLocal.escudo_url} alt="" className="w-5 h-5 rounded-full object-cover" />
          )}
          {timeLocal.nome}
        </div>
      );
    }
    return "Selecione um time ou digite manualmente";
  }, [timeAdversarioId, timeAdversarioExterno, times]);
  
  // ML Sugestão
  const { data: padroesML } = useSugestaoEscalacao(team.id, escalacaoData.formacao);
  
  // Lista de jogadores confirmados
  const jogadoresConfirmados = useMemo(() => {
    if (!confirmacoes) return [];
    // Retornar IDs dos jogadores confirmados
    return jogadores?.filter(j => confirmacoes.confirmados > 0).map(j => j.id) || [];
  }, [confirmacoes, jogadores]);
  
  // Position slots da formação
  const positionSlots = useMemo(() => {
    return positionSlotsByFormation[escalacaoData.formacao] || [];
  }, [escalacaoData.formacao]);
  
  // Preview de jogadores no campo
  const jogadoresPreview = useMemo(() => {
    return Object.entries(escalacaoData.jogadores_por_posicao)
      .filter(([, id]) => id)
      .map(([posicao, jogadorId]) => {
        const jogador = jogadores?.find(j => j.id === jogadorId);
        return jogador ? { jogador, posicao_campo: posicao } : null;
      })
      .filter(Boolean) as Array<{ jogador: Jogador; posicao_campo: string }>;
  }, [escalacaoData.jogadores_por_posicao, jogadores]);
  
  // Jogadores alocados (titulares + banco)
  const todosJogadoresAlocados = useMemo(() => {
    const titulares = Object.values(escalacaoData.jogadores_por_posicao).filter(Boolean);
    return [...titulares, ...escalacaoData.banco];
  }, [escalacaoData.jogadores_por_posicao, escalacaoData.banco]);
  
  // Sugerir escalação com ML
  const handleSugerirEscalacao = () => {
    if (!jogadores) return;
    
    const sugestao = sugerirEscalacaoInteligente({
      formacao: escalacaoData.formacao,
      jogadoresDisponiveis: jogadores,
      padroes: padroesML || [],
      confirmados: jogadoresConfirmados,
    });
    
    setEscalacaoData(prev => ({
      ...prev,
      jogadores_por_posicao: sugestao,
    }));
    
    toast({
      title: "Escalação sugerida!",
      description: `Sugerido ${Object.keys(sugestao).length} jogadores baseado nos padrões.`,
    });
  };
  
  // Handle submit
  const handleSubmit = async () => {
    // Validar dados do jogo
    if (!jogoData.data_hora || !jogoData.local || !jogoData.adversario) {
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios do jogo.",
      });
      setActiveTab("jogo");
      return;
    }
    
    await onSubmit({
      jogo: {
        ...jogoData,
        time_adversario_id: timeAdversarioId !== "manual" ? timeAdversarioId : null,
      },
      escalacao: escalacaoData.criarEscalacao ? escalacaoData : undefined,
    });
  };
  
  return (
    <div className="space-y-6">
      {/* Header com progresso */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className={cn(
            "flex items-center gap-1",
            activeTab === "jogo" ? "text-primary font-medium" : ""
          )}>
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">1</span>
            Dados do Jogo
          </span>
          <ChevronRight className="h-4 w-4" />
          <span className={cn(
            "flex items-center gap-1",
            activeTab === "escalacao" ? "text-primary font-medium" : ""
          )}>
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">2</span>
            Escalação
          </span>
        </div>
        
        {escalacaoData.criarEscalacao && (
          <Badge variant="outline" className="text-xs">
            {Object.keys(escalacaoData.jogadores_por_posicao).filter(k => escalacaoData.jogadores_por_posicao[k]).length}/{positionSlots.length} posições
          </Badge>
        )}
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="jogo">Dados do Jogo</TabsTrigger>
          <TabsTrigger value="escalacao" disabled={!jogoData.data_hora}>
            Escalação
            {escalacaoData.criarEscalacao && (
              <span className="ml-1 text-xs text-muted-foreground">(opcional)</span>
            )}
          </TabsTrigger>
        </TabsList>
        
        {/* Aba Dados do Jogo */}
        <TabsContent value="jogo" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Data *</Label>
              <DatePickerPopover
                date={jogoData.data_hora ? new Date(jogoData.data_hora) : undefined}
                onSelect={(date) => {
                  if (date) {
                    const currentTime = jogoData.data_hora 
                      ? new Date(jogoData.data_hora).toTimeString().slice(0, 5)
                      : "20:00";
                    setJogoData({
                      ...jogoData,
                      data_hora: `${format(date, "yyyy-MM-dd")}T${currentTime}`,
                    });
                  }
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Horário *</Label>
              <TimePickerSelect
                value={jogoData.data_hora ? new Date(jogoData.data_hora).toTimeString().slice(0, 5) : "20:00"}
                onChange={(time) => {
                  const currentDate = jogoData.data_hora 
                    ? jogoData.data_hora.split("T")[0]
                    : format(new Date(), "yyyy-MM-dd");
                  setJogoData({
                    ...jogoData,
                    data_hora: `${currentDate}T${time}`,
                  });
                }}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Adversário *</Label>
            <Select 
              value={timeAdversarioId} 
              onValueChange={(value) => {
                setTimeAdversarioId(value);
                if (value === "manual") {
                  setJogoData({ ...jogoData, adversario: "" });
                } else {
                  // Procurar na lista local primeiro
                  const timeLocal = times?.find(t => t.id === value);
                  if (timeLocal) {
                    setJogoData({ ...jogoData, adversario: timeLocal.nome });
                  } else if (timeAdversarioExterno?.id === value) {
                    // É o time externo
                    setJogoData({ ...jogoData, adversario: timeAdversarioExterno.nome });
                  }
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um time ou digite manualmente">
                  {adversarioSelectValue}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Digitar manualmente</SelectItem>
                {/* Time externo (de outro clube) - mostra primeiro se existir */}
                {timeAdversarioExterno && (
                  <SelectItem key={timeAdversarioExterno.id} value={timeAdversarioExterno.id}>
                    <div className="flex items-center gap-2">
                      {timeAdversarioExterno.escudo_url && (
                        <img src={timeAdversarioExterno.escudo_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                      )}
                      <span>{timeAdversarioExterno.nome}</span>
                      <Badge variant="secondary" className="ml-1 text-[10px]">Vinculado</Badge>
                    </div>
                  </SelectItem>
                )}
                {times?.filter(t => !t.is_casa).map((time) => (
                  <SelectItem key={time.id} value={time.id}>
                    <div className="flex items-center gap-2">
                      {time.escudo_url && (
                        <img src={time.escudo_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                      )}
                      {time.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {timeAdversarioId === "manual" && (
            <div className="space-y-2">
              <Label>Nome do Adversário *</Label>
              <Input
                value={jogoData.adversario}
                onChange={(e) => setJogoData({ ...jogoData, adversario: e.target.value })}
                placeholder="Digite o nome do time adversário"
                required
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Local *</Label>
            <Input
              value={jogoData.local}
              onChange={(e) => setJogoData({ ...jogoData, local: e.target.value })}
              placeholder="Estádio, arena, etc."
            />
          </div>
          
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Tipo de Jogo</Label>
              <Select 
                value={jogoData.tipo_jogo} 
                onValueChange={(v) => setJogoData({ ...jogoData, tipo_jogo: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amistoso">Amistoso</SelectItem>
                  <SelectItem value="campeonato">Campeonato</SelectItem>
                  <SelectItem value="treino">Treino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Mando</Label>
              <Select 
                value={jogoData.mando} 
                onValueChange={(v) => setJogoData({ ...jogoData, mando: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mandante">Mandante</SelectItem>
                  <SelectItem value="visitante">Visitante</SelectItem>
                  <SelectItem value="neutro">Neutro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Modalidade (para escalação)</Label>
              <Select 
                value={escalacaoData.modalidade} 
                onValueChange={(v) => setEscalacaoData({ ...escalacaoData, modalidade: v as GameModality })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(modalityLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Observações</Label>
            <Input
              value={jogoData.observacoes}
              onChange={(e) => setJogoData({ ...jogoData, observacoes: e.target.value })}
              placeholder="Informações adicionais sobre o jogo"
            />
          </div>
          
          {/* Checkbox para criar escalação */}
          <Alert className="bg-primary/5 border-primary/20">
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="flex items-center justify-between">
              <span>Criar escalação para este jogo?</span>
              <Switch
                checked={escalacaoData.criarEscalacao}
                onCheckedChange={(checked) => 
                  setEscalacaoData({ ...escalacaoData, criarEscalacao: checked })
                }
              />
            </AlertDescription>
          </Alert>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button 
              onClick={() => setActiveTab("escalacao")}
              disabled={!jogoData.data_hora || !jogoData.adversario || !jogoData.local}
            >
              {escalacaoData.criarEscalacao ? "Próximo: Escalação" : "Salvar Jogo"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
        
        {/* Aba Escalação */}
        <TabsContent value="escalacao" className="space-y-4">
          {!escalacaoData.criarEscalacao ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Você optou por não criar escalação agora.</p>
              <p className="text-sm">Poderá criar depois na página de escalações.</p>
            </div>
          ) : (
            <>
              {/* Configurações da escalação */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Formação</Label>
                  <Select 
                    value={escalacaoData.formacao} 
                    onValueChange={(v) => setEscalacaoData({ 
                      ...escalacaoData, 
                      formacao: v,
                      jogadores_por_posicao: {}, // Reset ao mudar formação
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formacoesPorModalidade[escalacaoData.modalidade]?.map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Botão Sugerir com IA removido - funcionalidade desativada */}
              </div>
              
              {/* Campo visual */}
              <div className="flex flex-col items-center">
                <Label className="mb-2 block text-center">
                  Clique nas posições para selecionar jogadores
                  <span className="block text-xs text-muted-foreground mt-1">
                    ({Object.keys(escalacaoData.jogadores_por_posicao).filter(k => escalacaoData.jogadores_por_posicao[k]).length}/{positionSlots.length} posições)
                  </span>
                </Label>
                <SocietyField
                  modalidade={escalacaoData.modalidade}
                  formacao={escalacaoData.formacao}
                  jogadores={jogadoresPreview}
                  className="mx-auto"
                  isEditable={true}
                  onPlayerMove={(jogadorId, encodedPos) => {
                    setEscalacaoData(prev => ({
                      ...prev,
                      posicoes_customizadas: {
                        ...prev.posicoes_customizadas,
                        [jogadorId]: encodedPos
                      }
                    }));
                  }}
                  onPositionClick={(posicao) => setQuickSelectPosicao(posicao)}
                  onPlayerRemove={(jogadorId) => {
                    const posicaoDoJogador = Object.entries(escalacaoData.jogadores_por_posicao).find(
                      ([, id]) => id === jogadorId
                    )?.[0];
                    
                    if (posicaoDoJogador) {
                      setEscalacaoData(prev => ({
                        ...prev,
                        jogadores_por_posicao: {
                          ...prev.jogadores_por_posicao,
                          [posicaoDoJogador]: ""
                        }
                      }));
                    }
                  }}
                />
              </div>
              
              {/* Banco de Reservas */}
              <Card className="bg-black/20 border-white/10">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Banco de Reservas ({escalacaoData.banco.length})</Label>
                  </div>
                  
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (value && !escalacaoData.banco.includes(value)) {
                        setEscalacaoData(prev => ({
                          ...prev,
                          banco: [...prev.banco, value]
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Adicionar jogador ao banco..." />
                    </SelectTrigger>
                    <SelectContent>
                      {jogadores?.filter(j => 
                        !todosJogadoresAlocados.includes(j.id)
                      ).map((jogador) => (
                        <SelectItem key={jogador.id} value={jogador.id}>
                          <div className="flex items-center gap-2">
                            {jogador.numero !== null && (
                              <Badge variant="outline" className="h-5 px-1 font-mono text-xs">
                                #{jogador.numero}
                              </Badge>
                            )}
                            <span>{jogador.apelido || jogador.nome}</span>
                            <span className="text-xs text-muted-foreground">
                              {positionLabels[jogador.posicao]}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {escalacaoData.banco.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {escalacaoData.banco.map((jogadorId) => {
                        const jogador = jogadores?.find(j => j.id === jogadorId);
                        if (!jogador) return null;
                        return (
                          <div
                            key={jogadorId}
                            className="flex items-center gap-2 rounded-full bg-black/20 border border-white/10 px-3 py-1"
                          >
                            <span className="text-sm">
                              {jogador.numero !== null && <span className="mr-1 font-bold">#{jogador.numero}</span>}
                              {jogador.apelido || jogador.nome}
                            </span>
                            <button
                              type="button"
                              onClick={() => setEscalacaoData(prev => ({
                                ...prev,
                                banco: prev.banco.filter(id => id !== jogadorId)
                              }))}
                              className="rounded-full p-0.5 hover:bg-destructive hover:text-destructive-foreground"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Publicar */}
              <div className="flex items-center gap-2">
                <Switch
                  id="publicar"
                  checked={escalacaoData.publicada}
                  onCheckedChange={(checked) => 
                    setEscalacaoData({ ...escalacaoData, publicada: checked })
                  }
                />
                <Label htmlFor="publicar">Publicar escalação imediatamente</Label>
              </div>
            </>
          )}
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setActiveTab("jogo")}>
              Voltar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : "Salvar Jogo e Escalação"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Dialog de Seleção Rápida */}
      <Dialog open={!!quickSelectPosicao} onOpenChange={(open) => {
        if (!open) {
          setQuickSelectPosicao(null);
          setFiltroPosicao("todas"); // Resetar filtro ao fechar
        }
      }}>
        <DialogContent className="max-w-sm max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              Selecionar {positionSlotLabels[quickSelectPosicao || ""]}
            </DialogTitle>
            <DialogDescription>
              Escolha um jogador para esta posição
            </DialogDescription>
          </DialogHeader>
          
          {/* Filtro por posição */}
          <div className="py-2">
            <Select value={filtroPosicao} onValueChange={setFiltroPosicao}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filtrar por posição" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as posições</SelectItem>
                <SelectItem value="goleiro">Goleiro</SelectItem>
                <SelectItem value="zagueiro">Zagueiro</SelectItem>
                <SelectItem value="lateral">Lateral</SelectItem>
                <SelectItem value="volante">Volante</SelectItem>
                <SelectItem value="meia">Meia</SelectItem>
                <SelectItem value="atacante">Atacante</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2 overflow-y-auto max-h-[50vh] py-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground"
                onClick={() => {
                  setEscalacaoData(prev => ({
                    ...prev,
                    jogadores_por_posicao: {
                      ...prev.jogadores_por_posicao,
                      [quickSelectPosicao]: ""
                    }
                  }));
                  setQuickSelectPosicao(null);
                }}
              >
                — Nenhum jogador
              </Button>
              
              {jogadores
                ?.filter(j => {
                  // Filtro: não mostrar jogadores já alocados em outras posições
                  const alocado = Object.entries(escalacaoData.jogadores_por_posicao).some(
                    ([pos, id]) => id === j.id && pos !== quickSelectPosicao
                  );
                  if (alocado && escalacaoData.jogadores_por_posicao[quickSelectPosicao] !== j.id) return false;
                  
                  // Filtro por posição
                  if (filtroPosicao === "todas") return true;
                  return j.posicao === filtroPosicao;
                })
                .sort((a, b) => (a.numero || 99) - (b.numero || 99))
                .map((jogador) => (
                  <JogadorSelecaoButton
                    key={jogador.id}
                    jogador={jogador}
                    isSelected={escalacaoData.jogadores_por_posicao[quickSelectPosicao] === jogador.id}
                    isConfirmed={jogadoresConfirmados.includes(jogador.id)}
                    onClick={() => {
                      setEscalacaoData(prev => ({
                        ...prev,
                        jogadores_por_posicao: {
                          ...prev.jogadores_por_posicao,
                          [quickSelectPosicao!]: jogador.id
                        }
                      }));
                      setQuickSelectPosicao(null);
                    }}
                  />
                ))}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => setQuickSelectPosicao(null)}
            >
              Cancelar
            </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
