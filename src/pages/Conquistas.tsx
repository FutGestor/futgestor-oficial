import React, { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { usePlayerPerformance } from "@/hooks/useEstatisticas";
import { AchievementBadge } from "@/components/achievements/AchievementBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, History, Calendar, Medal, Users, ChevronRight, GraduationCap, Shield } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AchievementDetailsModal } from "@/components/achievements/AchievementDetailsModal";
import { PlayerRadarChart } from "@/components/PlayerRadarChart";
import { ActivityCalendar } from "@/components/ActivityCalendar";
import { SeasonSelector } from "@/components/SeasonSelector";

import { usePlayerAchievements, type PlayerAchievement } from "@/hooks/useAchievements";

export default function Conquistas() {
  const { profile, isAdmin } = useAuth();
  const { team } = useTeamSlug();
  const [selectedJogadorId, setSelectedJogadorId] = useState<string | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<PlayerAchievement | null>(null);
  const [season, setSeason] = useState(new Date().getFullYear().toString());
  
  // Estados para colapsar/expandir
  const [showAllUniversal, setShowAllUniversal] = useState(false);
  const [showAllPosition, setShowAllPosition] = useState(false);

  const userJogadorId = (profile as any)?.jogador_id as string | undefined;
  const targetJogadorId = (isAdmin && selectedJogadorId) ? selectedJogadorId : userJogadorId;
  
  // Para o calendário, "Todas" volta para o ano atual, mas os stats serão de todas
  const selectedYear = season === "all" ? new Date().getFullYear() : parseInt(season);

  // Carregar lista de jogadores se for Admin
  const { data: jogadores } = useQuery({
    queryKey: ["team-players", team?.id],
    enabled: !!team?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jogadores")
        .select("*")
        .eq("team_id", team!.id)
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data as any[];
    }
  });

  const currentJogador = (jogadores?.find(j => j.id === targetJogadorId) || (targetJogadorId === (profile as any)?.jogador_id ? {
    id: targetJogadorId,
    nome: (profile as any)?.nome as string,
    apelido: (profile as any)?.nome as string,
    posicao: "Atleta" as any,
    foto_url: (profile as any)?.foto_url as string | null,
    data_entrada: (profile as any)?.created_at as string | null
  } : null)) as any;

  const { data: achievementsData, isLoading: loadingAchievements } = usePlayerAchievements(targetJogadorId || undefined);
  const { data: performance } = usePlayerPerformance(targetJogadorId || undefined, team?.id);

  // Filtragem de Stats por Temporada em memória
  const filteredPlayerStats = (performance as any)?.playerStats?.filter((s: any) => {
    if (season === "all") return true;
    const gameYear = new Date(s.resultado?.jogo?.data_hora || "").getFullYear().toString();
    return gameYear === season;
  });

  const unlockedCount = achievementsData?.filter(a => !!a.current_tier).length || 0;
  const totalCount = achievementsData?.length || 0;
  const progressPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  const achievementsResults = achievementsData as PlayerAchievement[] | undefined;
  
  // Separação por Categoria
  const universalAchievements = achievementsResults?.filter(a => a.achievement.category === 'universal') || [];
  const positionAchievements = achievementsResults?.filter(a => a.achievement.category !== 'universal') || [];

  const sortAchievements = (list: PlayerAchievement[]) => {
    return [...list].sort((a, b) => {
      if (a.current_tier && !b.current_tier) return -1;
      if (!a.current_tier && b.current_tier) return 1;
      return 0;
    });
  };

  const stats = filteredPlayerStats ? {
    gols: filteredPlayerStats.reduce((acc: number, s: any) => acc + (s.gols || 0), 0),
    assists: filteredPlayerStats.reduce((acc: number, s: any) => acc + (s.assistencias || 0), 0),
    jogos: filteredPlayerStats.filter((s: any) => s.participou).length,
    mvps: filteredPlayerStats.filter((s: any) => s.resultado?.mvp_jogador_id === targetJogadorId).length,
  } : { gols: 0, assists: 0, jogos: 0, mvps: 0 };

  return (
    <Layout>
      <div className="container px-4 py-8 space-y-8 mb-20 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              Arena de Conquistas
            </h1>
            <p className="text-zinc-500 font-medium">Sua jornada rumo à glória eterna no {team?.nome || "clube"}.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <SeasonSelector value={season} onChange={setSeason} />
            {isAdmin && (
              <div className="w-full md:w-64">
                <Select value={targetJogadorId || ""} onValueChange={setSelectedJogadorId}>
                  <SelectTrigger className="bg-black/40 border-white/10 text-white h-11">
                    <SelectValue placeholder="Selecionar Jogador" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white">
                    {jogadores?.map(j => (
                      <SelectItem key={j.id} value={j.id}>{j.apelido || j.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Hero Card Premium com Radar */}
        <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden relative group transition-all hover:border-primary/30">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
          <div className="p-6 md:p-10 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              {/* Lado Esquerdo: Perfil e Stats */}
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
                  <Avatar className="h-28 w-28 border-4 border-primary/20 ring-4 ring-black/50">
                    {currentJogador?.foto_url ? (
                      <AvatarImage src={currentJogador.foto_url} alt={currentJogador.nome} className="object-cover" />
                    ) : (
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        <Users className="h-12 w-12" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div className="space-y-3">
                    <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase">
                      {currentJogador?.apelido || currentJogador?.nome}
                    </h2>
                    <div className="flex items-center justify-center md:justify-start gap-4">
                      <span className="text-xs font-black text-primary uppercase tracking-[0.2em] flex items-center gap-1.5">
                        <Target className="h-3 w-3" />
                        {currentJogador?.posicao || "Atleta"}
                      </span>
                      <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                        Membro desde {currentJogador?.data_entrada ? format(new Date(currentJogador.data_entrada), "MMM/yyyy", { locale: ptBR }) : (profile?.created_at ? format(new Date(profile.created_at), "MMM/yyyy", { locale: ptBR }) : "--")}
                      </span>
                    </div>
                  </div>

                  {/* Dados Físicos Premium */}
                  {(currentJogador?.pe_preferido || currentJogador?.altura_cm || currentJogador?.peso_kg) && (
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      {currentJogador.pe_preferido && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md border border-white/5">
                          <Shield className="h-3 w-3 text-primary/50" />
                          <span className="text-[10px] font-black uppercase text-zinc-400">Pé: <span className="text-white">{currentJogador.pe_preferido}</span></span>
                        </div>
                      )}
                      {currentJogador.altura_cm && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md border border-white/5">
                          <Shield className="h-3 w-3 text-primary/50" />
                          <span className="text-[10px] font-black uppercase text-zinc-400">Alt: <span className="text-white">{(currentJogador.altura_cm / 100).toFixed(2)} m</span></span>
                        </div>
                      )}
                      {currentJogador.peso_kg && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md border border-white/5">
                          <Shield className="h-3 w-3 text-primary/50" />
                          <span className="text-[10px] font-black uppercase text-zinc-400">Peso: <span className="text-white">{currentJogador.peso_kg}kg</span></span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bio do Atleta */}
                {currentJogador?.bio && (
                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl md:max-w-md">
                    <p className="text-zinc-400 text-sm italic leading-relaxed">
                      "{currentJogador.bio}"
                    </p>
                  </div>
                )}

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-4 py-6 border-y border-white/5">
                  <div className="space-y-1">
                    <span className="text-2xl font-black italic text-white leading-none">{stats.jogos}</span>
                    <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Jogos</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-2xl font-black italic text-white leading-none">{stats.gols}</span>
                    <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Gols</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-2xl font-black italic text-white leading-none">{stats.assists}</span>
                    <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Assists</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-2xl font-black italic text-white leading-none">{stats.mvps}</span>
                    <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">MVPs</p>
                  </div>
                </div>

                {/* Glory Progress */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Progresso de Glória</span>
                    <span className="text-xs font-black italic text-primary">
                      {unlockedCount} / {totalCount} Concluídas
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-2 bg-white/5" />
                </div>
              </div>

              {/* Lado Direito: Radar Chart */}
              <div className="flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">
                    📊 Mapa de Atleta
                  </span>
                  <div className="h-px flex-1 mx-4 bg-white/5" />
                </div>
                {targetJogadorId && team?.id ? (
                  <PlayerRadarChart jogadorId={targetJogadorId} teamId={team.id} />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-zinc-600 italic text-sm">
                    Aguardando seleção...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <ActivityCalendar 
          jogadorId={targetJogadorId || ""} 
          teamId={team?.id || ""} 
          year={selectedYear} 
        />

        {/*Achievements Summary Counter */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <p className="text-white font-black uppercase tracking-tight leading-none">
                        {unlockedCount} de {totalCount} Conquistas Desbloqueadas
                    </p>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                        Sua evolução como atleta de elite
                    </p>
                </div>
            </div>
            <div className="w-full sm:w-48 h-1.5 bg-black/40 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(212,168,75,0.4)]" 
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
        </div>

        {/* Achievements Sections */}
        {loadingAchievements ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : (
          <div className="space-y-16 pb-12">
            {/* Universais — Somente se houver conquistas universais no sistema */}
            {universalAchievements.length > 0 && universalAchievements.some(a => !!a.current_tier || showAllUniversal) && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-400">
                    ━━ Conquistas Universais ({universalAchievements.filter(a => !!a.current_tier).length}/{universalAchievements.length}) ━━
                  </h3>
                </div>
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-4 gap-y-12 justify-items-center transition-all duration-500">
                  {sortAchievements(universalAchievements)
                    .filter(a => !!a.current_tier || showAllUniversal)
                    .map((a) => (
                      <AchievementBadge
                        key={a.achievement_id}
                        slug={a.achievement.slug}
                        tier={a.current_tier}
                        name={a.achievement.name}
                        showName={true}
                        size="sm"
                        locked={!a.current_tier}
                        onClick={() => setSelectedAchievement(a)}
                      />
                  ))}
                </div>
                
                {universalAchievements.length > universalAchievements.filter(a => !!a.current_tier).length && (
                  <div className="flex justify-center pt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowAllUniversal(!showAllUniversal)}
                      className="text-zinc-500 hover:text-white hover:bg-white/5 gap-2 uppercase text-[10px] font-black tracking-widest"
                    >
                      {showAllUniversal ? "Ocultar bloqueadas ▲" : `Ver todas as ${universalAchievements.length} conquistas ▼`}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* De Posição */}
            {positionAchievements.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-400">
                    ━━ Conquistas de {currentJogador?.posicao || "Posição"} ({positionAchievements.filter(a => !!a.current_tier).length}/{positionAchievements.length}) ━━
                  </h3>
                </div>

                {/* Lógica de Lista: Desbloqueadas ou Motivacional se 0 */}
                {positionAchievements.filter(a => !!a.current_tier).length === 0 && !showAllPosition ? (
                   <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="h-16 w-16 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mb-2">
                            <Trophy className="h-8 w-8 text-zinc-700" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-white font-black uppercase italic tracking-tighter text-lg">Jogue mais partidas para brilhar!</p>
                            <p className="text-zinc-500 text-sm max-w-xs mx-auto">Você ainda não desbloqueou conquistas de posição. Veja o que você pode conquistar:</p>
                        </div>
                        <div className="flex gap-6 pt-4">
                            {positionAchievements.slice(0, 3).map((a) => (
                                <div key={a.achievement_id} className="opacity-30 grayscale hover:opacity-50 transition-all cursor-help" onClick={() => setSelectedAchievement(a)}>
                                    <AchievementBadge 
                                        slug={a.achievement.slug} 
                                        tier={null} 
                                        size="sm" 
                                    />
                                </div>
                            ))}
                        </div>
                   </div>
                ) : (
                  <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-4 gap-y-12 justify-items-center transition-all duration-500">
                    {sortAchievements(positionAchievements)
                        .filter(a => !!a.current_tier || showAllPosition)
                        .map((a) => (
                      <AchievementBadge
                        key={a.achievement_id}
                        slug={a.achievement.slug}
                        tier={a.current_tier}
                        name={a.achievement.name}
                        showName={true}
                        size="sm"
                        locked={!a.current_tier}
                        onClick={() => setSelectedAchievement(a)}
                      />
                    ))}
                  </div>
                )}
                
                {positionAchievements.length > positionAchievements.filter(a => !!a.current_tier).length && (
                  <div className="flex justify-center pt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowAllPosition(!showAllPosition)}
                      className="text-zinc-500 hover:text-white hover:bg-white/5 gap-2 uppercase text-[10px] font-black tracking-widest"
                    >
                      {showAllPosition ? "Ocultar bloqueadas ▲" : `Ver todas as ${positionAchievements.length} conquistas ▼`}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Details Modal */}
        <AchievementDetailsModal
          isOpen={!!selectedAchievement}
          onOpenChange={(open) => !open && setSelectedAchievement(null)}
          playerAchievement={selectedAchievement}
        />
      </div>
    </Layout>
  );
}
