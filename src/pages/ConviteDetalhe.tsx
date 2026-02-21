import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, X, Shield, Users, Trophy, MapPin, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
        {/* Convite Card */}
        <Card className="bg-black/40 border-white/10 overflow-hidden">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            
            <div>
              <h1 className="text-2xl font-black uppercase italic text-white mb-1">
                Novo Convite!
              </h1>
              <p className="text-muted-foreground">
                Você foi convidado para joinar um time
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Time Info */}
        <Card className="bg-black/40 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-white/10">
                <AvatarImage src={convite.time?.escudo_url} />
                <AvatarFallback className="bg-primary/20 text-primary text-xl">
                  {convite.time?.nome?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">{convite.time?.nome}</h2>
                {(convite.time?.cidade || convite.time?.estado) && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {convite.time?.cidade}{convite.time?.cidade && convite.time?.estado && ", "}{convite.time?.estado}
                  </p>
                )}
              </div>
            </div>

            {convite.mensagem && (
              <div className="mt-4 p-4 bg-white/5 rounded-lg">
                <p className="text-sm text-muted-foreground italic">
                  "{convite.mensagem}"
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            size="lg"
            className="h-14 border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
            onClick={() => setConfirmDialog({ open: true, aceitar: false })}
            disabled={responder.isPending}
          >
            <X className="h-5 w-5 mr-2" />
            Recusar
          </Button>
          
          <Button
            size="lg"
            className="h-14 bg-primary hover:bg-primary/90"
            onClick={() => setConfirmDialog({ open: true, aceitar: true })}
            disabled={responder.isPending}
          >
            {responder.isPending ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Check className="h-5 w-5 mr-2" />
            )}
            Aceitar
          </Button>
        </div>
      </div>

      {/* Dialog de Confirmação */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent className="bg-[#0a0a0a] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {confirmDialog.aceitar ? "Aceitar convite?" : "Recusar convite?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {confirmDialog.aceitar 
                ? `Você vai sair do seu time atual e joinar o ${convite.time?.nome}. Tem certeza?`
                : "Você não poderá aceitar este convite depois."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResponder}
              className={confirmDialog.aceitar ? "bg-primary hover:bg-primary/90" : "bg-red-500 hover:bg-red-600"}
            >
              {confirmDialog.aceitar ? "Sim, aceitar" : "Sim, recusar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
