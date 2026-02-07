import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, MapPin, Check, X, Loader2 } from "lucide-react";
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
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
    <div className="min-h-screen bg-background">
      <Toaster />
      <div className="mx-auto max-w-lg space-y-6 p-4 pt-8">
        {/* Info do Jogo */}
        <Card>
          <CardContent className="space-y-3 p-6">
            <h1 className="text-center text-xl font-bold">Confirmação de Presença</h1>
            <h2 className="text-center text-lg font-semibold text-primary">
              vs {jogo.adversario}
            </h2>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(dataJogo, "dd/MM/yyyy", { locale: ptBR })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {format(dataJogo, "HH:mm")}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {jogo.local}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Instrução */}
        <p className="text-center text-sm text-muted-foreground">
          Toque no seu nome para confirmar ou informar ausência.
        </p>

        {/* Lista de Jogadores */}
        <div className="space-y-2">
          {jogadores.map((jogador: any) => {
            const isSelected = selectedJogador === jogador.id;
            const confirmed = confirmedMap[jogador.id];

            return (
              <Card key={jogador.id} className={confirmed ? "border-green-500/30" : ""}>
                <CardContent className="p-3">
                  <button
                    className="flex w-full items-center gap-3 text-left"
                    onClick={() => setSelectedJogador(isSelected ? null : jogador.id)}
                    disabled={submitting}
                  >
                    {jogador.foto_url ? (
                      <img src={jogador.foto_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold">
                        {(jogador.apelido || jogador.nome).charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{jogador.apelido || jogador.nome}</p>
                      <p className="text-xs capitalize text-muted-foreground">{jogador.posicao}</p>
                    </div>
                    {confirmed && (
                      <Badge variant={confirmed === "confirmado" ? "default" : "destructive"} className="gap-1">
                        {confirmed === "confirmado" ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        {confirmed === "confirmado" ? "Vou" : "Não vou"}
                      </Badge>
                    )}
                  </button>

                  {isSelected && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => handleConfirm(jogador.id, "confirmado")}
                        disabled={submitting}
                      >
                        {submitting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                        Vou jogar
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleConfirm(jogador.id, "ausente")}
                        disabled={submitting}
                      >
                        {submitting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <X className="mr-1 h-4 w-4" />}
                        Não vou
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
