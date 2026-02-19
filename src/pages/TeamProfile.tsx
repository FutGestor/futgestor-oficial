import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { TeamShield } from "@/components/TeamShield";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LoadingScreen } from "@/components/LoadingScreen";
import {
  ArrowLeft, MapPin, Users, Trophy, Swords, CalendarDays, Instagram,
  Youtube, Facebook, MessageCircle, Send, FileText, BarChart3, User2,
  AlertCircle
} from "lucide-react";
import { DatePickerPopover } from "@/components/ui/date-picker-popover";
import { TimePickerSelect } from "@/components/ui/time-picker-select";
import { format, parseISO, isSameDay } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GameResult {
  gols_favor: number;
  gols_contra: number;
}

interface TeamGame {
  id: string;
  adversario: string;
  data_hora: string;
  status: string;
  resultados?: GameResult | GameResult[];
}

interface TeamProfileData {
  id: string;
  nome: string;
  slug: string;
  escudo_url: string | null;
  banner_url: string | null;
  bio: string | null;
  cidade: string | null;
  uf: string | null;
  modalidade: string | null;
  faixa_etaria: string | null;
  genero: string | null;
  redes_sociais: Record<string, string>;
}

export default function TeamProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [mensagem, setMensagem] = useState("");
  const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>(undefined);
  const [horaSelecionada, setHoraSelecionada] = useState<string>("15:00");
  const [localSugerido, setLocalSugerido] = useState("");
  const [sending, setSending] = useState(false);

  // Fetch team data
  const { data: team, isLoading: loadingTeam } = useQuery({
    queryKey: ["team-profile", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("slug", slug!)
        .single();
      if (error) throw error;
      return data as unknown as TeamProfileData;
    },
  });

  // Fetch players
  const { data: jogadores } = useQuery({
    queryKey: ["team-profile-players", team?.id],
    enabled: !!team?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("jogadores")
        .select("id, nome, apelido, posicao, foto_url")
        .eq("team_id", team.id)
        .eq("ativo", true)
        .order("nome");
      return data || [];
    },
  });

  // Fetch target team games for availability check
  const { data: targetTeamGames } = useQuery({
    queryKey: ["target-team-games", team?.id],
    enabled: !!team?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("jogos")
        .select("*")
        .eq("team_id", team.id)
        .gte("data_hora", new Date().toISOString())
        .order("data_hora", { ascending: true });
      return (data || []) as unknown as TeamGame[];
    },
  });

  const hasConflict = dataSelecionada && targetTeamGames?.some(jogo => {
    const gameDate = parseISO(jogo.data_hora);
    return isSameDay(gameDate, dataSelecionada);
  });

  // Fetch finished games with results
  const { data: jogos } = useQuery({
    queryKey: ["team-profile-games", team?.id],
    enabled: !!team?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("jogos")
        .select("*, resultados(*)")
        .eq("team_id", team.id)
        .eq("status", "finalizado")
        .order("data_hora", { ascending: false })
        .limit(10);
      return (data || []) as unknown as TeamGame[];
    },
  });

  // Stats calculation
  const totalJogos = jogos?.length || 0;
  const vitorias = jogos?.filter((j) => {
    const r = Array.isArray(j.resultados) ? j.resultados[0] : j.resultados;
    return r && r.gols_favor > r.gols_contra;
  }).length || 0;
  const empates = jogos?.filter((j) => {
    const r = Array.isArray(j.resultados) ? j.resultados[0] : j.resultados;
    return r && r.gols_favor === r.gols_contra;
  }).length || 0;
  const derrotas = totalJogos - vitorias - empates;
  const aproveitamento = totalJogos > 0 ? Math.round((vitorias * 3 + empates * 1) / (totalJogos * 3) * 100) : 0;

  // Form sequence (last 5)
  const formSequence = jogos?.slice(0, 5).map((j) => {
    const r = Array.isArray(j.resultados) ? j.resultados[0] : j.resultados;
    if (!r) return "?";
    if (r.gols_favor > r.gols_contra) return "V";
    if (r.gols_favor === r.gols_contra) return "E";
    return "D";
  }) || [];

  // Check if current user belongs to a different team
  const userTeamId = profile?.team_id;
  const canChallenge = user && userTeamId && userTeamId !== team?.id;
  const isOwnTeam = userTeamId === team?.id;

  // Fetch current user's team info for the request
  const { data: myTeam } = useQuery({
    queryKey: ["my-team-info", userTeamId],
    enabled: !!userTeamId,
    queryFn: async () => {
      const { data } = await supabase
        .from("teams")
        .select("nome, redes_sociais")
        .eq("id", userTeamId!)
        .single();
      return data;
    }
  });

  const handleSendChallenge = async () => {
    if (!canChallenge || !team?.id || !userTeamId) return;
    setSending(true);
    try {
      let dataPreferida = null;
      let horarioPreferido = "15:00";
      if (dataSelecionada) {
        dataPreferida = format(dataSelecionada, "yyyy-MM-dd");
        horarioPreferido = horaSelecionada;
      }

      const whatsapp = (myTeam?.redes_sociais as any)?.whatsapp || "";

      // solicitacoes_jogo table unifed schema
      const { error } = await (supabase as any).from("solicitacoes_jogo").insert({
        team_id: team.id, // Time que recebe a solicitação
        time_solicitante_id: userTeamId,
        user_solicitante_id: user!.id,
        nome_time: myTeam?.nome || profile?.nome || "Time Visitante",
        email_contato: user?.email || "",
        telefone_contato: whatsapp,
        mensagem: mensagem || null,
        data_preferida: dataPreferida,
        horario_preferido: horarioPreferido,
        local_sugerido: localSugerido || null,
        status: "pendente"
      });
      if (error) throw error;
      toast({ title: "Solicitação enviada!", description: "O time receberá sua proposta." });
      setMensagem("");
      setDataSelecionada(undefined);
      setLocalSugerido("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro", description: err.message || "Falha ao enviar solicitação." });
    } finally {
      setSending(false);
    }
  };

  if (loadingTeam) return <Layout><LoadingScreen /></Layout>;
  if (!team) return (
    <Layout>
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Time não encontrado</h1>
        <Link to="/explorar" className="text-primary underline">Voltar ao Explorar</Link>
      </div>
    </Layout>
  );

  const redes = (team.redes_sociais || {}) as Record<string, string>;

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
            <TeamShield escudoUrl={team.escudo_url} teamName={team.nome} size="xl" />
            <h1 className="text-3xl font-black uppercase italic text-white">{team.nome}</h1>

            {(team.cidade || team.uf) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{team.cidade}{team.uf ? ` - ${team.uf}` : ""}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2 justify-center">
              {team.modalidade && (
                <Badge variant="secondary" className="bg-white/5 text-xs">⚽ {team.modalidade}</Badge>
              )}
              {team.faixa_etaria && (
                <Badge variant="secondary" className="bg-white/5 text-xs">🏷️ {team.faixa_etaria}</Badge>
              )}
              {team.genero && (
                <Badge variant="secondary" className="bg-white/5 text-xs">👥 {team.genero}</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bio */}
        {team.bio && (
          <Card className="bg-black/40 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase tracking-wider text-primary flex items-center gap-2">
                <FileText className="h-4 w-4" /> Sobre o Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{team.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        {totalJogos > 0 && (
          <Card className="bg-black/40 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase tracking-wider text-primary flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 text-center">
                <div className="bg-black/30 rounded-lg p-3">
                  <div className="text-2xl font-black text-white">{totalJogos}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Jogos</div>
                </div>
                <div className="bg-black/30 rounded-lg p-3">
                  <div className="text-2xl font-black text-green-400">{vitorias}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Vitórias</div>
                </div>
                <div className="bg-black/30 rounded-lg p-3">
                  <div className="text-2xl font-black text-yellow-400">{empates}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Empates</div>
                </div>
                <div className="bg-black/30 rounded-lg p-3">
                  <div className="text-2xl font-black text-red-400">{derrotas}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Derrotas</div>
                </div>
                <div className="bg-black/30 rounded-lg p-3">
                  <div className="text-2xl font-black text-primary">{aproveitamento}%</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Aproveit.</div>
                </div>
              </div>

              {formSequence.length > 0 && (
                <div className="flex items-center gap-2 justify-center pt-2">
                  <span className="text-xs text-muted-foreground mr-2">Forma:</span>
                  {formSequence.map((f: string, i: number) => (
                    <span
                      key={i}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                        f === "V" ? "bg-green-500/20 text-green-400" :
                        f === "E" ? "bg-yellow-500/20 text-yellow-400" :
                        f === "D" ? "bg-red-500/20 text-red-400" :
                        "bg-white/10 text-white/50"
                      }`}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Results */}
        {jogos && jogos.length > 0 && (
          <Card className="bg-black/40 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase tracking-wider text-primary flex items-center gap-2">
                <Trophy className="h-4 w-4" /> Últimos Resultados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {jogos.slice(0, 5).map((jogo) => {
                const r = Array.isArray(jogo.resultados) ? jogo.resultados[0] : jogo.resultados;
                const golsFavor = r?.gols_favor ?? "?";
                const golsContra = r?.gols_contra ?? "?";
                const dataStr = new Date(jogo.data_hora).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

                return (
                  <div key={jogo.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/20 text-sm">
                    <div className="flex items-center gap-2 font-bold text-white">
                      <span>{team.nome}</span>
                      <span className="text-primary">{golsFavor} x {golsContra}</span>
                      <span className="text-muted-foreground">{jogo.adversario}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{dataStr}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Squad */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm uppercase tracking-wider text-primary flex items-center gap-2">
              <Users className="h-4 w-4" /> Elenco ({jogadores?.length || 0} jogadores)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {jogadores && jogadores.length > 0 ? jogadores.map((j: any) => (
              <Link
                key={j.id}
                to={`/explorar/jogador/${j.id}`}
                className="flex items-center gap-3 py-2 px-3 rounded-lg bg-black/20 hover:bg-black/40 transition-colors group"
              >
                <Avatar className="h-10 w-10 border border-white/10">
                  <AvatarImage src={j.foto_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                    {j.nome?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-sm text-white group-hover:text-primary transition-colors truncate block">
                    {j.apelido || j.nome}
                  </span>
                  {j.posicao && <span className="text-xs text-muted-foreground">{j.posicao}</span>}
                </div>
              </Link>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum jogador cadastrado.</p>
            )}
          </CardContent>
        </Card>

        {/* Contact / Social */}
        {(redes.instagram || redes.youtube || redes.facebook || redes.whatsapp) && (
          <Card className="bg-black/40 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase tracking-wider text-primary flex items-center gap-2">
                📱 Contato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {redes.instagram && (
                  <a href={redes.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-black/30 rounded-lg text-sm hover:bg-primary/20 transition-colors">
                    <Instagram className="h-4 w-4" /> Instagram
                  </a>
                )}
                {redes.youtube && (
                  <a href={redes.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-black/30 rounded-lg text-sm hover:bg-primary/20 transition-colors">
                    <Youtube className="h-4 w-4" /> YouTube
                  </a>
                )}
                {redes.facebook && (
                  <a href={redes.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-black/30 rounded-lg text-sm hover:bg-primary/20 transition-colors">
                    <Facebook className="h-4 w-4" /> Facebook
                  </a>
                )}
                {redes.whatsapp && (
                  <a href={redes.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-black/30 rounded-lg text-sm hover:bg-primary/20 transition-colors">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Challenge Form */}
        {canChallenge && (
          <Card className="bg-black/40 border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase tracking-wider text-primary flex items-center gap-2">
                <Swords className="h-4 w-4" /> Solicitar Jogo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Ex: Temos horário livre sábado às 15h, vamos jogar?"
                className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-4 h-20 text-sm resize-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none"
                maxLength={500}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Data Sugerida</label>
                  <DatePickerPopover 
                    date={dataSelecionada} 
                    setDate={setDataSelecionada}
                    className="bg-black/30 border-white/10 h-10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Horário</label>
                  <TimePickerSelect 
                    value={horaSelecionada}
                    onChange={setHoraSelecionada}
                  />
                </div>
              </div>

              {hasConflict && (
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400 py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    ⚠️ Atenção: Este time já possui um compromisso marcado para este dia.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Local Sugerido</label>
                <Input
                  value={localSugerido}
                  onChange={(e) => setLocalSugerido(e.target.value)}
                  placeholder="Campo, quadra..."
                  className="bg-black/30 border-white/10 h-10"
                />
              </div>
              <Button
                onClick={handleSendChallenge}
                disabled={sending}
                className="w-full h-12 bg-primary hover:bg-primary/90 font-black uppercase italic gap-2"
              >
                <Send className="h-4 w-4" /> {sending ? "Enviando..." : "Enviar Solicitação de Jogo"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Info if own team */}
        {isOwnTeam && (
          <div className="text-center text-sm text-muted-foreground py-4">
            Este é o seu time. Gerencie-o em{" "}
            <Link to={`/time/${slug}/gestao`} className="text-primary underline">Gestão</Link>.
          </div>
        )}

        {/* Info if no team */}
        {user && !userTeamId && (
          <div className="text-center text-sm text-muted-foreground py-4 bg-black/20 rounded-xl p-6">
            <Swords className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p>Crie um time para solicitar jogos e interagir com outros times.</p>
            <Link to="/escolha" className="text-primary underline mt-2 inline-block">Criar Time</Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
