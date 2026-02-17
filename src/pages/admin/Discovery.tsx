import { useState } from "react";
import { Search, MapPin, Sword, Filter, Loader2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usePublicTeams } from "@/hooks/usePublicTeams";
import { TeamConfig, useTeamConfig } from "@/hooks/useTeamConfig";
import { ManagementHeader } from "@/components/layout/ManagementHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ESCUDO_PADRAO } from "@/lib/constants";
import { Layout } from "@/components/layout/Layout";
import { TeamShield } from "@/components/TeamShield";

export default function Discovery() {
  const { team: myTeam } = useTeamConfig();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<Partial<TeamConfig> | null>(null);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [challengeMessage, setChallengeMessage] = useState("");
  const [sendingChallenge, setSendingChallenge] = useState(false);

  const { data: teams, isLoading } = usePublicTeams(
    { search: searchTerm, cidade: cityFilter },
    myTeam.cidade,
    myTeam.estado
  );

  const handleSendChallenge = async () => {
    if (!selectedTeam || !myTeam.id) return;
    setSendingChallenge(true);

    try {
      const { error } = await supabase
        .from("solicitacoes_jogo")
        .insert({
          team_id: (selectedTeam as any).id, // O time que RECEBE a solicitação
          nome_time: myTeam.nome, // Nome do time que envia
          escudo_url_adversario: myTeam.escudo_url,
          observacoes: challengeMessage || `Olá! O time ${myTeam.nome} gostaria de marcar uma partida.`,
          status: "pendente",
        } as any);

      if (error) throw error;

      toast({
        title: "Desafio Enviado!",
        description: `Sua solicitação foi enviada para o ${selectedTeam.nome}.`,
      });
      setIsChallengeModalOpen(false);
      setChallengeMessage("");
    } catch (err: unknown) {
      const error = err as Error;
      toast({
        title: "Erro ao enviar",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setSendingChallenge(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 container py-8 px-4 md:px-6">
        <ManagementHeader 
          title="Mercado de Desafios" 
          subtitle="Encontre adversários na sua região e envie desafios diretos." 
        />

      {/* Busca e Filtros */}
      <div className="grid gap-4 md:grid-cols-[1fr,200px,auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome do time..."
            className="pl-9 bg-black/40 border-white/10 backdrop-blur-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cidade..."
            className="pl-9 bg-black/40 border-white/10 backdrop-blur-xl"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" className="bg-black/40 border-white/10 backdrop-blur-xl">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Grid de Times */}
      {searchTerm.length < 2 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground border-2 border-dashed border-white/10 rounded-xl bg-black/20 backdrop-blur-sm">
          <Search className="mb-4 h-12 w-12 opacity-20" />
          <h3 className="text-lg font-bold text-foreground">Aguardando busca...</h3>
          <p>Digite pelo menos 2 letras para ver as sugestões de times adversários.</p>
        </div>
      ) : isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {teams?.filter(t => t.id !== myTeam.id).map((teamItem: Partial<TeamConfig>) => (
            <Card key={teamItem.id} className="bg-black/40 backdrop-blur-xl border-white/10 overflow-hidden group hover:border-primary/50 transition-all duration-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute -inset-1 bg-primary/20 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                      <TeamShield 
                        escudoUrl={teamItem.escudo_url || null} 
                        teamName={teamItem.nome || "Time"} 
                        size="lg" 
                        className="relative border-white/10"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{teamItem.nome}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {teamItem.cidade} {teamItem.estado ? `- ${teamItem.estado}` : ""}
                      </div>
                    </div>
                  </div>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-white font-bold h-12 px-6 rounded-xl shadow-lg shadow-primary/20"
                    onClick={() => {
                      setSelectedTeam(teamItem);
                      setIsChallengeModalOpen(true);
                    }}
                  >
                    <Sword className="mr-2 h-4 w-4" />
                    DESAFIAR
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {teams?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground bg-black/20 border-2 border-dashed border-white/10 rounded-2xl">
              <Info className="mb-4 h-12 w-12 opacity-20" />
              <p className="text-lg font-medium">Nenhum time encontrado com esse nome.</p>
              <Button variant="link" onClick={() => { setSearchTerm(""); setCityFilter(""); }} className="text-primary">Limpar busca</Button>
            </div>
          )}
        </div>
      )}

      {/* Modal de Envio de Desafio */}
      <Dialog open={isChallengeModalOpen} onOpenChange={setIsChallengeModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sword className="h-5 w-5 text-primary" />
              Desafiar {selectedTeam?.nome}
            </DialogTitle>
            <DialogDescription>
              Uma notificação será enviada diretamente para o painel de solicitações do adversário.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-center">
            <div className="flex justify-center flex-col items-center gap-4">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <TeamShield 
                    escudoUrl={myTeam.escudo_url || null} 
                    teamName={myTeam.nome || "Meu Time"} 
                    size="lg" 
                    className="mx-auto mb-2"
                  />
                  <p className="text-xs font-bold truncate max-w-[80px]">{myTeam.nome}</p>
                </div>
                <div className="font-italic font-black text-2xl text-muted-foreground italic">VS</div>
                <div className="text-center">
                  <TeamShield 
                    escudoUrl={selectedTeam?.escudo_url || null} 
                    teamName={selectedTeam?.nome || "Adversário"} 
                    size="lg" 
                    className="mx-auto mb-2"
                  />
                  <p className="text-xs font-bold truncate max-w-[80px]">{selectedTeam?.nome}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-left">
              <p className="text-sm font-medium">Incluir mensagem personalizada (opcional):</p>
              <Textarea 
                placeholder="Ex: Queremos marcar esse amistoso para o próximo sábado na nossa quadra..."
                value={challengeMessage}
                onChange={(e) => setChallengeMessage(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsChallengeModalOpen(false)} disabled={sendingChallenge}>
              Cancelar
            </Button>
            <Button 
              className="bg-primary hover:bg-primary/90 text-white font-bold"
              onClick={handleSendChallenge}
              disabled={sendingChallenge}
            >
              {sendingChallenge ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Confirmar Desafio"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </Layout>
  );
}
