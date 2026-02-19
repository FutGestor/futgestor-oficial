import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useTeamAdmin } from "@/hooks/useTeamAdmin";
import { TeamShield } from "@/components/TeamShield";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, MapPin, BarChart3, Trophy, CalendarDays, Send, UserPlus
} from "lucide-react";

export default function PlayerProfile() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [mensagem, setMensagem] = useState("");
  const [sending, setSending] = useState(false);

  // Fetch player
  const { data: player, isLoading } = useQuery({
    queryKey: ["player-profile", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jogadores")
        .select(`
          id, nome, apelido, posicao, foto_url, created_at, user_id,
          teams:team_id(id, nome, slug, escudo_url, cidade, uf)
        `)
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  // Team admin check for recruit button
  const userTeamId = profile?.team_id;
  const { isTeamAdmin } = useTeamAdmin(userTeamId || undefined);
  const playerTeamId = player?.teams?.id;
  const canRecruit = user && isTeamAdmin && userTeamId && playerTeamId && userTeamId !== playerTeamId;

  // Fetch player stats (goals, assists, MVPs, games)
  const { data: stats } = useQuery({
    queryKey: ["player-stats", id],
    enabled: !!id,
    queryFn: async () => {
      // Games played
      const { count: gamesPlayed } = await supabase
        .from("presencas")
        .select("*", { count: "exact", head: true })
        .eq("jogador_id", id!)
        .eq("presente", true);

      // Goals
      // @ts-expect-error - table not yet in generated types
      const { data: goalsData } = await supabase
        .from("gols")
        .select("id")
        .eq("jogador_id", id!);

      // Assists
      // @ts-expect-error - table not yet in generated types
      const { data: assistsData } = await supabase
        .from("gols")
        .select("id")
        .eq("assistencia_jogador_id", id!);

      // MVPs
      const { count: mvpCount } = await supabase
        .from("resultados")
        .select("*", { count: "exact", head: true })
        .eq("mvp_jogador_id", id!);

      return {
        jogos: gamesPlayed || 0,
        gols: goalsData?.length || 0,
        assistencias: assistsData?.length || 0,
        mvps: mvpCount || 0,
      };
    },
  });

  // Fetch player achievements
  const { data: conquistas } = useQuery({
    queryKey: ["player-achievements", id],
    enabled: !!id,
    queryFn: async () => {
      // @ts-expect-error - table not yet in generated types
      const { data } = await supabase
        .from("conquistas")
        .select("*")
        .eq("jogador_id", id!)
        .eq("desbloqueada", true);
      return data || [];
    },
  });

  const handleRecruit = async () => {
    if (!canRecruit || !player) return;
    setSending(true);
    try {
      // @ts-expect-error - table not yet in generated types
      const { error } = await supabase.from("solicitacoes_ingresso").insert({
        jogador_user_id: player.user_id,
        jogador_nome: player.apelido || player.nome,
        jogador_posicao: player.posicao,
        time_alvo_id: userTeamId!,
        mensagem: mensagem || null,
      });
      if (error) throw error;
      toast({ title: "Solicitação enviada!", description: "O jogador receberá seu convite." });
      setMensagem("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro", description: err.message || "Falha ao enviar." });
    } finally {
      setSending(false);
    }
  };

  if (isLoading) return <Layout><LoadingScreen /></Layout>;
  if (!player) return (
    <Layout>
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Jogador não encontrado</h1>
        <Link to="/explorar" className="text-primary underline">Voltar ao Explorar</Link>
      </div>
    </Layout>
  );

  const memberSince = player.created_at
    ? new Date(player.created_at).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
    : null;

  const golsPerJogo = stats && stats.jogos > 0 ? (stats.gols / stats.jogos).toFixed(2) : "0.00";

  return (
    <Layout>
      <div className="container py-6 px-4 md:px-6 max-w-3xl mx-auto space-y-6 pb-24">
        {/* Back */}
        <Link to="/explorar" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar ao Explorar
        </Link>

        {/* Header */}
        <Card className="bg-black/40 border-white/10 overflow-hidden">
          <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
            <Avatar className="h-24 w-24 border-4 border-white/10 shadow-2xl">
              <AvatarImage src={player.foto_url || undefined} className="object-cover" />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl font-black">
                {player.nome?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <h1 className="text-3xl font-black uppercase italic text-white">
              {player.apelido || player.nome}
            </h1>

            {player.posicao && (
              <Badge variant="secondary" className="bg-primary/20 text-primary text-sm">
                ⚽ {player.posicao}
              </Badge>
            )}

            {player.teams && (
              <Link
                to={`/explorar/time/${player.teams.slug}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors"
              >
                <TeamShield escudoUrl={player.teams.escudo_url} teamName={player.teams.nome} size="xs" />
                <span>{player.teams.nome}</span>
                {(player.teams.cidade || player.teams.uf) && (
                  <>
                    <span className="text-white/30">·</span>
                    <MapPin className="h-3 w-3" />
                    <span className="text-xs">{player.teams.cidade}{player.teams.uf ? ` - ${player.teams.uf}` : ""}</span>
                  </>
                )}
              </Link>
            )}

            {memberSince && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
                <CalendarDays className="h-3 w-3" /> Membro desde {memberSince}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        {stats && (
          <Card className="bg-black/40 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase tracking-wider text-primary flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="bg-black/30 rounded-lg p-3">
                  <div className="text-2xl font-black text-white">{stats.jogos}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Jogos</div>
                </div>
                <div className="bg-black/30 rounded-lg p-3">
                  <div className="text-2xl font-black text-green-400">{stats.gols}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Gols</div>
                </div>
                <div className="bg-black/30 rounded-lg p-3">
                  <div className="text-2xl font-black text-blue-400">{stats.assistencias}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Assists</div>
                </div>
                <div className="bg-black/30 rounded-lg p-3">
                  <div className="text-2xl font-black text-yellow-400">{stats.mvps}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">MVP</div>
                </div>
                <div className="bg-black/30 rounded-lg p-3">
                  <div className="text-2xl font-black text-primary">{golsPerJogo}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Gols/Jogo</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Achievements */}
        {conquistas && conquistas.length > 0 && (
          <Card className="bg-black/40 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase tracking-wider text-primary flex items-center gap-2">
                <Trophy className="h-4 w-4" /> Conquistas ({conquistas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {conquistas.map((c: any) => (
                  <Badge key={c.id} className="bg-white/5 text-white border-white/10 py-1.5 px-3 text-xs">
                    {c.icone || "🏆"} {c.titulo}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recruit Form */}
        {canRecruit && (
          <Card className="bg-black/40 border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase tracking-wider text-primary flex items-center gap-2">
                <UserPlus className="h-4 w-4" /> Recrutar Jogador
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Queremos te convidar para o nosso time..."
                className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-4 h-20 text-sm resize-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none"
                maxLength={500}
              />
              <Button
                onClick={handleRecruit}
                disabled={sending}
                className="w-full h-12 bg-primary hover:bg-primary/90 font-black uppercase italic gap-2"
              >
                <Send className="h-4 w-4" /> {sending ? "Enviando..." : "Enviar Solicitação"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
