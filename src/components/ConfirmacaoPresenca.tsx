import { useState } from "react";
import { Check, X, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useJogadores } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import { useConfirmacoesJogo, useConfirmarPresenca, useConfirmacoesContagem } from "@/hooks/useConfirmacoes";
import type { PresenceStatus } from "@/lib/types";

interface ConfirmacaoPresencaProps {
  jogoId: string;
  compact?: boolean;
}

export function ConfirmacaoPresenca({ jogoId, compact = false }: ConfirmacaoPresencaProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedJogador, setSelectedJogador] = useState<string>("");
  
  const { user, profile, isAdmin, isApproved } = useAuth();
  const { data: jogadores } = useJogadores();
  const { data: confirmacoes } = useConfirmacoesJogo(jogoId);
  const { data: contagem } = useConfirmacoesContagem(jogoId);
  const confirmarPresenca = useConfirmarPresenca();
  const { toast } = useToast();

  // Para usuários não logados ou não aprovados - apenas mostra contagem (somente leitura)
  if (!user || !isApproved) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span className="text-green-600 font-medium">{contagem?.confirmados || 0}</span>
        <span>/</span>
        <span className="text-red-600 font-medium">{contagem?.indisponiveis || 0}</span>
      </div>
    );
  }

  // Para jogadores aprovados sem jogador_id vinculado (e que não são admin)
  if (!profile?.jogador_id && !isAdmin) {
    return (
      <div className="text-sm text-muted-foreground">
        Vincule seu perfil a um jogador para confirmar presença
      </div>
    );
  }

  // Jogador ID a ser usado para confirmação
  // Para admins com seletor, usa o selecionado; para jogadores normais, usa o próprio
  const getJogadorIdParaConfirmar = () => {
    if (isAdmin && selectedJogador) {
      return selectedJogador;
    }
    return profile?.jogador_id || "";
  };

  const handleConfirmar = async (status: PresenceStatus) => {
    const jogadorId = getJogadorIdParaConfirmar();
    
    if (!jogadorId) {
      toast({
        variant: "destructive",
        title: isAdmin ? "Selecione um jogador" : "Perfil não vinculado",
      });
      return;
    }

    try {
      await confirmarPresenca.mutateAsync({
        jogoId,
        jogadorId,
        status,
      });
      toast({
        title: status === "confirmado" 
          ? "Presença confirmada!" 
          : status === "indisponivel" 
            ? "Indisponibilidade registrada" 
            : "Status atualizado",
      });
      setSelectedJogador("");
    } catch {
      toast({
        variant: "destructive",
        title: "Erro ao confirmar presença",
      });
    }
  };

  // Obter status atual do jogador logado
  const getStatusAtual = () => {
    if (!profile?.jogador_id) return null;
    return confirmacoes?.find((c) => c.jogador_id === profile.jogador_id)?.status;
  };

  const statusAtual = getStatusAtual();

  // Badge de contagem compacta
  if (compact) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="text-green-600">{contagem?.confirmados || 0}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-red-600">{contagem?.indisponiveis || 0}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md" onCloseAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Confirmar Presença</DialogTitle>
            <DialogDescription>
              Confirme sua presença no jogo ou gerencie confirmações de jogadores.
            </DialogDescription>
          </DialogHeader>
          <ConfirmacaoContent
            jogadores={jogadores}
            confirmacoes={confirmacoes}
            selectedJogador={selectedJogador}
            setSelectedJogador={setSelectedJogador}
            handleConfirmar={handleConfirmar}
            isLoading={confirmarPresenca.isPending}
            isAdmin={isAdmin}
            profile={profile}
            statusAtual={statusAtual}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2">
          <Users className="h-4 w-4" />
          Confirmar Presença
          {contagem && contagem.confirmados > 0 && (
            <Badge variant="secondary">{contagem.confirmados}</Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" onCloseAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Confirmar Presença</DialogTitle>
          <DialogDescription>
            Confirme sua presença no jogo ou gerencie confirmações de jogadores.
          </DialogDescription>
        </DialogHeader>
        <ConfirmacaoContent
          jogadores={jogadores}
          confirmacoes={confirmacoes}
          selectedJogador={selectedJogador}
          setSelectedJogador={setSelectedJogador}
          handleConfirmar={handleConfirmar}
          isLoading={confirmarPresenca.isPending}
          isAdmin={isAdmin}
          profile={profile}
          statusAtual={statusAtual}
        />
      </DialogContent>
    </Dialog>
  );
}

function ConfirmacaoContent({
  jogadores,
  confirmacoes,
  selectedJogador,
  setSelectedJogador,
  handleConfirmar,
  isLoading,
  isAdmin,
  profile,
  statusAtual,
}: {
  jogadores: any[] | undefined;
  confirmacoes: any[] | undefined;
  selectedJogador: string;
  setSelectedJogador: (v: string) => void;
  handleConfirmar: (status: PresenceStatus) => void;
  isLoading: boolean;
  isAdmin: boolean;
  profile: { jogador_id: string | null } | null;
  statusAtual: PresenceStatus | null | undefined;
}) {
  const getJogadorStatus = (jogadorId: string) => {
    return confirmacoes?.find((c) => c.jogador_id === jogadorId)?.status;
  };

  // Encontrar dados do jogador vinculado ao perfil
  const jogadorVinculado = jogadores?.find((j) => j.id === profile?.jogador_id);

  return (
    <div className="space-y-4">
      {/* Para Admin: Seletor de jogador */}
      {isAdmin && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Selecione o jogador (Admin)</label>
          <Select value={selectedJogador} onValueChange={setSelectedJogador}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um jogador" />
            </SelectTrigger>
            <SelectContent>
              {jogadores?.map((jogador) => {
                const status = getJogadorStatus(jogador.id);
                return (
                  <SelectItem key={jogador.id} value={jogador.id}>
                    <div className="flex items-center gap-2">
                      <span>{jogador.apelido || jogador.nome}</span>
                      {status && (
                        <Badge
                          variant={status === "confirmado" ? "default" : status === "indisponivel" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {status === "confirmado" ? "✓" : status === "indisponivel" ? "✗" : "?"}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Para Jogador Normal: Mostrar quem vai confirmar */}
      {!isAdmin && jogadorVinculado && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Confirmando como:</label>
          <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
            <span className="font-medium">{jogadorVinculado.apelido || jogadorVinculado.nome}</span>
            {statusAtual && (
              <Badge
                variant={statusAtual === "confirmado" ? "default" : statusAtual === "indisponivel" ? "destructive" : "secondary"}
              >
                {statusAtual === "confirmado" ? "Confirmado" : statusAtual === "indisponivel" ? "Indisponível" : "Pendente"}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Botões de ação */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={() => handleConfirmar("confirmado")}
          disabled={isLoading || (isAdmin && !selectedJogador)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Check className="mr-2 h-4 w-4" />
          Vou jogar
        </Button>
        <Button
          variant="destructive"
          onClick={() => handleConfirmar("indisponivel")}
          disabled={isLoading || (isAdmin && !selectedJogador)}
        >
          <X className="mr-2 h-4 w-4" />
          Não posso
        </Button>
      </div>

      {/* Lista de confirmações */}
      {confirmacoes && confirmacoes.length > 0 && (
        <div className="mt-4 space-y-2 border-t pt-4">
          <h4 className="text-sm font-medium">Confirmações</h4>
          <div className="space-y-1">
            {confirmacoes
              .filter((c) => c.status === "confirmado")
              .map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 rounded-md bg-green-100 px-2 py-1 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-400"
                >
                  <Check className="h-3 w-3" />
                  {c.jogador?.apelido || c.jogador?.nome}
                </div>
              ))}
            {confirmacoes
              .filter((c) => c.status === "indisponivel")
              .map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 rounded-md bg-red-100 px-2 py-1 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-400"
                >
                  <X className="h-3 w-3" />
                  {c.jogador?.apelido || c.jogador?.nome}
                </div>
              ))}
            {confirmacoes
              .filter((c) => c.status === "pendente")
              .map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 rounded-md bg-muted px-2 py-1 text-sm text-muted-foreground"
                >
                  <Clock className="h-3 w-3" />
                  {c.jogador?.apelido || c.jogador?.nome}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
