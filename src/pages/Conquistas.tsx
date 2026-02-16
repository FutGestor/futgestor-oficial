import React, { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { usePlayerPerformance } from "@/hooks/useEstatisticas";
import { usePlayerAchievements } from "@/hooks/useAchievements";
import { AchievementBadge } from "@/components/achievements/AchievementBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, History, Calendar, Medal, Users, ChevronRight, GraduationCap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AchievementDetailsModal } from "@/components/achievements/AchievementDetailsModal";

export default function Conquistas() {
  const { profile, isAdmin } = useAuth();
  const { team } = useTeamSlug();
  const [selectedJogadorId, setSelectedJogadorId] = useState<string | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);

  const targetJogadorId = (isAdmin && selectedJogadorId) ? selectedJogadorId : profile?.jogador_id;

  // Carregar lista de jogadores se for Admin
  const { data: jogadores } = useQuery({
    queryKey: ["team-players", team?.id],
    enabled: !!team?.id && isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jogadores")
        .select("id, nome, apelido, posicao, foto_url")
        .eq("team_id", team!.id)
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    }
  });

  const currentJogador = jogadores?.find(j => j.id === targetJogadorId) || (targetJogadorId === profile?.jogador_id ? {
    nome: profile?.nome,
    posicao: "Atleta",
    foto_url: (profile as any)?.foto_url
  } : null);

  const { data: achievementsData, isLoading: loadingAchievements } = usePlayerAchievements(targetJogadorId || undefined);
  const { data: performance } = usePlayerPerformance(targetJogadorId || undefined, team?.id);

  const unlockedCount = achievementsData?.filter(a => !!a.current_tier).length || 0;
  const totalCount = achievementsData?.length || 0;
  const progressPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  const universalAchievements = achievementsData?.filter(a => a.achievement.category === 'universal') || [];
  const positionAchievements = achievementsData?.filter(a => a.achievement.category !== 'universal') || [];

  const sortAchievements = (list: any[]) => {
    return [...list].sort((a, b) => {
      if (a.current_tier && !b.current_tier) return -1;
      if (!a.current_tier && b.current_tier) return 1;
      return 0;
    });
  };

  const stats = performance?.playerStats ? {
    gols: performance.playerStats.reduce((acc, s) => acc + (s.gols || 0), 0),
    assists: performance.playerStats.reduce((acc, s) => acc + (s.assistencias || 0), 0),
    jogos: performance.playerStats.filter(s => s.participou).length,
  } : { gols: 0, assists: 0, jogos: 0 };

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

        {/* Athlete Profile Card */}
        <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Medal className="h-64 w-64 rotate-12" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-primary shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]">
                <AvatarImage src={currentJogador?.foto_url || ""} />
                <AvatarFallback className="bg-zinc-800 text-zinc-500">
                  <Users className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-primary text-black font-black text-xs px-3 py-1 rounded-full shadow-lg">
                ATIVO
              </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">
                  {currentJogador?.nome || "Atleta"}
                </h2>
                <div className="flex items-center justify-center md:justify-start gap-4 mt-1">
                  <p className="text-primary font-bold uppercase tracking-widest text-xs flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {currentJogador?.posicao || "Posição"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Gols</p>
                  <p className="text-xl font-black text-white italic">⚽ {stats.gols}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Assists</p>
                  <p className="text-xl font-black text-white italic">🅰️ {stats.assists}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Jogos</p>
                  <p className="text-xl font-black text-white italic">📅 {stats.jogos}</p>
                </div>
              </div>

              <div className="space-y-2 max-w-sm mx-auto md:mx-0">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Glória Geral</p>
                  <p className="text-xs font-bold text-primary italic">{unlockedCount} / {totalCount} Concluídas</p>
                </div>
                <Progress value={progressPercent} className="h-2.5 bg-zinc-900 border border-white/5" />
              </div>
            </div>
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
          <div className="space-y-12 pb-12">
            {/* Universais */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-400">
                  ━━ Conquistas Universais ({universalAchievements.filter(a => !!a.current_tier).length}/{universalAchievements.length}) ━━
                </h3>
              </div>
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-4 gap-y-12 justify-items-center">
                {sortAchievements(universalAchievements).map((a) => (
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
            </div>

            {/* De Posição */}
            {positionAchievements.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-400">
                    ━━ Conquistas de {currentJogador?.posicao || "Posição"} ({positionAchievements.filter(a => !!a.current_tier).length}/{positionAchievements.length}) ━━
                  </h3>
                </div>
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-4 gap-y-12 justify-items-center">
                  {sortAchievements(positionAchievements).map((a) => (
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
