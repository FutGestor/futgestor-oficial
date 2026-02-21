import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, X, Users, Trophy, MapPin, Calendar, Loader2, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useResponderSolicitacao } from "@/hooks/useConvites";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ConviteDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const responder = useResponderSolicitacao();
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; aceitar: boolean }>({
    open: false,
    aceitar: false,
  });

  const { data: convite, isLoading } = useQuery({
    queryKey: ["convite-detalhe", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_ingresso")
        .select(`
          *,
          time:time_alvo_id(
            id,
            nome,
            slug,
            escudo_url,
            cidade,
            estado
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as any;
    },
  });

  // Buscar estatísticas do time
  const { data: statsTime } = useQuery({
    queryKey: ["time-stats-convite", convite?.time?.id],
    enabled: !!convite?.time?.id,
    queryFn: async () => {
      const timeId = convite.time.id;
      
      // Total de jogadores
      const { count: totalJogadores } = await supabase
        .from("jogadores")
        .select("*", { count: "exact", head: true })
        .eq("team_id", timeId)
        .eq("ativo", true);
      
      // Total de jogos
      const { count: totalJogos } = await supabase
        .from("jogos")
        .select("*", { count: "exact", head: true })
        .eq("team_id", timeId);
      
      // Total de vitórias
      const { count: totalVitorias } = await supabase
        .from("resultados")
        .select("*", { count: "exact", head: true })
        .eq("team_id", timeId)
        .eq("resultado", "vitoria");

      return {
        jogadores: totalJogadores || 0,
        jogos: totalJogos || 0,
        vitorias: totalVitorias || 0,
      };
    },
  });

  const handleResponder = async () => {
    if (!id) return;
    
    try {
      await responder.mutateAsync({
        solicitacaoId: id,
        aceitar: confirmDialog.aceitar,
      });
      
      setConfirmDialog({ open: false, aceitar: false });
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f172a] to-[#1a1a2e] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!convite) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f172a] to-[#1a1a2e] p-4">
        <div className="max-w-md mx-auto pt-8">
          <div className="text-center">
            <h1 className="text-xl font-bold text-white mb-2">Convite não encontrado</h1>
            <p className="text-muted-foreground mb-4">Este convite pode ter expirado ou sido removido.</p>
            <Button onClick={() => navigate("/player/dashboard")}>Voltar ao Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  if (convite.status !== "pendente") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f172a] to-[#1a1a2e] p-4">
        <div className="max-w-md mx-auto pt-8">
          <Card className="bg-black/40 border-white/10">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">
                Convite {convite.status === "aceito" ? "aceito" : "recusado"}
              </h1>
              <p className="text-muted-foreground mb-4">
                Você já respondeu a este convite.
              </p>
              <Button onClick={() => navigate("/player/dashboard")} className="w-full">
                Ir para Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const time = convite.time;
  const mensagemAdmin = convite.mensagem || "Olá! Gostaríamos de você no nosso time. Venha fazer parte da nossa equipe!";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f172a] to-[#1a1a2e] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-md mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Header com título */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-full">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Novo Convite!</span>
          </div>
          <h1 className="text-2xl font-black uppercase italic text-white">
            Você foi convidado
          </h1>
          <p className="text-muted-foreground">
            Um time quer você no elenco
          </p>
        </div>

        {/* Card do Time - Destaque Principal */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 overflow-hidden">
          <CardContent className="p-6 text-center space-y-4">
            <Avatar className="h-24 w-24 mx-auto border-4 border-primary/30 shadow-2xl shadow-primary/20">
              <AvatarImage src={time?.escudo_url} className="object-cover" />
              <AvatarFallback className="bg-primary/20 text-primary text-3xl font-black">
                {time?.nome?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h2 className="text-2xl font-black uppercase italic text-white">{time?.nome}</h2>
              {(time?.cidade || time?.estado) && (
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {time?.cidade}{time?.cidade && time?.estado && ", "}{time?.estado}
                </p>
              )}
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              className="border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => navigate(`/explorar/time/${time?.slug}`)}
            >
              <Shield className="h-4 w-4 mr-2" />
              Ver Perfil do Time
            </Button>
          </CardContent>
        </Card>

        {/* Estatísticas do Time */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-black/40 border-white/10">
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 text-primary mx-auto mb-2" />
              <div className="text-2xl font-black text-white">{statsTime?.jogadores || 0}</div>
              <div className="text-xs text-muted-foreground">Jogadores</div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/40 border-white/10">
            <CardContent className="p-4 text-center">
              <Calendar className="h-5 w-5 text-primary mx-auto mb-2" />
              <div className="text-2xl font-black text-white">{statsTime?.jogos || 0}</div>
              <div className="text-xs text-muted-foreground">Jogos</div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/40 border-white/10">
            <CardContent className="p-4 text-center">
              <Trophy className="h-5 w-5 text-primary mx-auto mb-2" />
              <div className="text-2xl font-black text-white">{statsTime?.vitorias || 0}</div>
              <div className="text-xs text-muted-foreground">Vitórias</div>
            </CardContent>
          </Card>
        </div>

        {/* Mensagem do Administrador */}
        <Card className="bg-black/40 border-white/10">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Mensagem do Administrador
            </h3>
            <div className="p-4 bg-white/5 rounded-lg border-l-2 border-primary">
              <p className="text-white italic leading-relaxed">
                "{mensagemAdmin}"
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30">
          <CardContent className="p-5 text-center space-y-3">
            <h3 className="text-lg font-black uppercase italic text-white">
              Faça parte do time!
            </h3>
            <p className="text-sm text-muted-foreground">
              Aceite o convite e comece a jogar com <span className="text-white font-semibold">{time?.nome}</span> hoje mesmo. 
              Você terá acesso a todos os jogos, estatísticas e poderá interagir com seus novos companheiros de equipe!
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
              <Check className="h-3 w-3 text-green-500" />
              <span>Ao aceitar, você será transferido automaticamente para este time</span>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="space-y-3 pt-4">
          <Button
            size="lg"
            className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-black uppercase italic gap-2"
            onClick={() => setConfirmDialog({ open: true, aceitar: true })}
            disabled={responder.isPending}
          >
            {responder.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Check className="h-5 w-5" />
            )}
            Aceitar Convite
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="w-full h-14 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            onClick={() => setConfirmDialog({ open: true, aceitar: false })}
            disabled={responder.isPending}
          >
            <X className="h-5 w-5 mr-2" />
            Recusar
          </Button>
        </div>
      </div>

      {/* Dialog de Confirmação */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent className="bg-[#0a0a0a] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-lg">
              {confirmDialog.aceitar ? "Aceitar convite?" : "Recusar convite?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {confirmDialog.aceitar 
                ? `Você vai sair do seu time atual e joinar o ${time?.nome}. Tem certeza?`
                : "Você não poderá aceitar este convite depois."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResponder}
              className={confirmDialog.aceitar 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-red-500 hover:bg-red-600"
              }
            >
              {confirmDialog.aceitar ? "Sim, aceitar" : "Sim, recusar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
