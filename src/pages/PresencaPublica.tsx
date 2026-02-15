import { useState } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, MapPin, Check, X, Loader2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { supabase } from "@/integrations/supabase/client";

export default function PresencaPublica() {
  const { codigo } = useParams<{ codigo: string }>();
  const { toast } = useToast();
  const [selectedJogador, setSelectedJogador] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedMap, setConfirmedMap] = useState<Record<string, string>>({});

  // Fetch presenca_link + jogo + jogadores
  const { data, isLoading, error } = useQuery({
    queryKey: ["presenca-publica", codigo],
    queryFn: async () => {
      // Get presenca_link
      const { data: linkData, error: linkError } = await supabase
        .from("presenca_links" as any)
        .select("*")
        .eq("codigo", codigo!)
        .single();
      if (linkError) throw new Error("Link não encontrado");
      const link = linkData as any;

      // Get jogo
      const { data: jogo, error: jogoError } = await supabase
        .from("jogos")
        .select("*")
        .eq("id", link.jogo_id)
        .single();
      if (jogoError) throw jogoError;

      // Get jogadores do time
      const { data: jogadores, error: jogError } = await supabase
        .from("jogadores")
        .select("id, nome, apelido, posicao, numero, foto_url")
        .eq("team_id", link.team_id)
        .eq("ativo", true)
        .order("nome");
      if (jogError) throw jogError;

      return { link, jogo, jogadores: jogadores || [] };
    },
    enabled: !!codigo,
  });

  const handleConfirm = async (jogadorId: string, status: "confirmado" | "ausente") => {
    if (!data?.link) return;
    setSubmitting(true);
    try {
      // Try update first, then insert (upsert on unique constraint)
      const { data: existing } = await supabase
        .from("presencas" as any)
        .select("id")
        .eq("presenca_link_id", data.link.id)
        .eq("jogador_id", jogadorId)
        .maybeSingle();

      if ((existing as any)?.id) {
        const { error } = await supabase
          .from("presencas" as any)
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", (existing as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("presencas" as any)
          .insert({ presenca_link_id: data.link.id, jogador_id: jogadorId, status });
        if (error) throw error;
      }

      setConfirmedMap((prev) => ({ ...prev, [jogadorId]: status }));
      setSelectedJogador(null);
      toast({
        title: status === "confirmado" ? "✅ Presença confirmada!" : "❌ Ausência registrada!",
        description: "Sua resposta foi salva. Você pode alterar acessando este link novamente.",
      });
    } catch {
      toast({ variant: "destructive", title: "Erro ao salvar", description: "Tente novamente." });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-lg font-semibold text-destructive">Link inválido ou expirado</p>
            <p className="mt-2 text-sm text-muted-foreground">Verifique o link e tente novamente.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { jogo, jogadores } = data;
  const dataJogo = new Date(jogo.data_hora);

  return (
    <Layout>
      <div className="mx-auto max-w-lg space-y-6 px-4 py-12">
        {/* Info do Jogo */}
        <Card className="bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 group-hover:bg-primary transition-colors" />
          <CardContent className="space-y-4 p-8">
            <Badge className="bg-primary/20 text-primary border-primary/30 mx-auto table mb-2 uppercase italic font-black text-[10px]">Confirmação de Elite</Badge>
            <h1 className="text-center text-3xl font-black italic uppercase tracking-tighter text-white">
              VS <span className="text-primary">{jogo.adversario}</span>
            </h1>
            <div className="flex flex-wrap justify-center gap-6 text-[10px] font-bold uppercase italic text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-primary" />
                {format(dataJogo, "dd/MM/yyyy", { locale: ptBR })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-primary" />
                {format(dataJogo, "HH:mm")}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-primary" />
                {jogo.local}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Instrução */}
        <div className="bg-black/20 backdrop-blur-md p-4 rounded-xl border border-white/5 text-center">
          <p className="text-xs font-bold uppercase italic text-slate-500 tracking-widest">
            Selecione seu nome e confirme sua presença
          </p>
        </div>

        {/* Lista de Jogadores */}
        <div className="space-y-2">
          {jogadores.map((jogador: any) => {
            const isSelected = selectedJogador === jogador.id;
            const confirmed = confirmedMap[jogador.id];

            return (
              <Card key={jogador.id} className={cn(
                "bg-black/40 backdrop-blur-md border-white/5 hover:border-white/10 transition-all",
                confirmed === "confirmado" && "border-green-500/30 bg-green-500/5",
                confirmed === "ausente" && "border-red-500/30 bg-red-500/5"
              )}>
                <CardContent className="p-4">
                  <button
                    className="flex w-full items-center gap-4 text-left group"
                    onClick={() => setSelectedJogador(isSelected ? null : jogador.id)}
                    disabled={submitting}
                  >
                    <div className="relative">
                      {jogador.foto_url ? (
                        <img src={jogador.foto_url} alt="" className="h-12 w-12 rounded-full object-cover border-2 border-white/10 group-hover:border-primary transition-colors" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-lg font-black italic text-primary border-2 border-white/10 group-hover:border-primary transition-colors">
                          {(jogador.apelido || jogador.nome).charAt(0)}
                        </div>
                      )}
                      {confirmed && (
                        <div className={cn(
                          "absolute -bottom-1 -right-1 rounded-full p-1 border-2 border-black",
                          confirmed === "confirmado" ? "bg-green-500" : "bg-red-500"
                        )}>
                          {confirmed === "confirmado" ? <Check className="h-2 w-2 text-white" /> : <X className="h-2 w-2 text-white" />}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white uppercase italic text-sm">{jogador.apelido || jogador.nome}</p>
                      <p className="text-[10px] font-black uppercase text-slate-500 italic tracking-widest">{jogador.posicao}</p>
                    </div>
                    {!confirmed && <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-primary transition-colors" />}
                  </button>

                  {isSelected && (
                    <div className="mt-4 flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-500 text-white font-black italic text-xs h-10"
                        onClick={() => handleConfirm(jogador.id, "confirmado")}
                        disabled={submitting}
                      >
                        {submitting ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Check className="mr-2 h-3 w-3" />}
                        CONFIRMAR
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1 font-black italic text-xs h-10"
                        onClick={() => handleConfirm(jogador.id, "ausente")}
                        disabled={submitting}
                      >
                        {submitting ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <X className="mr-2 h-3 w-3" />}
                        AUSENTE
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
