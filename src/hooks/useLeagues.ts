import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTeamSlug } from "@/hooks/useTeamSlug";

// ─── Types ───
export interface League {
  id: string;
  team_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface LeagueTeam {
  id: string;
  league_id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
}

export interface LeagueMatch {
  id: string;
  league_id: string;
  round: number;
  team_home_id: string;
  team_away_id: string;
  score_home: number | null;
  score_away: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Standing {
  teamId: string;
  teamName: string;
  logoUrl: string | null;
  pts: number;
  j: number;
  v: number;
  e: number;
  d: number;
  gp: number;
  gc: number;
  sg: number;
}

// ─── Hooks ───

export function useLeagues(teamId?: string) {
  const { team } = useTeamSlug();
  const effectiveTeamId = teamId || team?.id;

  return useQuery({
    queryKey: ["leagues", effectiveTeamId],
    enabled: !!effectiveTeamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leagues")
        .select("*")
        .eq("team_id", effectiveTeamId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as League[];
    },
  });
}

export function useLeague(leagueId?: string) {
  return useQuery({
    queryKey: ["league", leagueId],
    enabled: !!leagueId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leagues")
        .select("*")
        .eq("id", leagueId!)
        .single();
      if (error) throw error;
      return data as League;
    },
  });
}

export function useLeagueTeams(leagueId?: string) {
  return useQuery({
    queryKey: ["league_teams", leagueId],
    enabled: !!leagueId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("league_teams")
        .select("*")
        .eq("league_id", leagueId!)
        .order("name");
      if (error) throw error;
      return data as LeagueTeam[];
    },
  });
}

export function useLeagueMatches(leagueId?: string) {
  return useQuery({
    queryKey: ["league_matches", leagueId],
    enabled: !!leagueId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("league_matches")
        .select("*")
        .eq("league_id", leagueId!)
        .order("round")
        .order("created_at");
      if (error) throw error;
      return data as LeagueMatch[];
    },
  });
}

/** Compute standings from matches + teams */
export function computeStandings(
  teams: LeagueTeam[],
  matches: LeagueMatch[]
): Standing[] {
  const map = new Map<string, Standing>();

  for (const t of teams) {
    map.set(t.id, {
      teamId: t.id,
      teamName: t.name,
      logoUrl: t.logo_url,
      pts: 0, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0,
    });
  }

  for (const m of matches) {
    if (m.status !== "finalizado" || m.score_home == null || m.score_away == null) continue;
    const home = map.get(m.team_home_id);
    const away = map.get(m.team_away_id);
    if (!home || !away) continue;

    home.j++; away.j++;
    home.gp += m.score_home; home.gc += m.score_away;
    away.gp += m.score_away; away.gc += m.score_home;

    if (m.score_home > m.score_away) {
      home.v++; home.pts += 3; away.d++;
    } else if (m.score_home < m.score_away) {
      away.v++; away.pts += 3; home.d++;
    } else {
      home.e++; away.e++; home.pts += 1; away.pts += 1;
    }
  }

  // Update SG
  for (const s of map.values()) {
    s.sg = s.gp - s.gc;
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.v !== a.v) return b.v - a.v;
    return b.sg - a.sg;
  });
}

// ─── Mutations ───

export function useCreateLeague() {
  const qc = useQueryClient();
  const { team } = useTeamSlug();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("leagues")
        .insert({ name, team_id: team.id })
        .select()
        .single();
      if (error) throw error;
      return data as League;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leagues"] }),
  });
}

export function useDeleteLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leagues").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leagues"] }),
  });
}

export function useCreateLeagueTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { league_id: string; name: string; logo_url?: string }) => {
      const { data, error } = await supabase
        .from("league_teams")
        .insert(params)
        .select()
        .single();
      if (error) throw error;
      return data as LeagueTeam;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["league_teams", v.league_id] }),
  });
}

export function useDeleteLeagueTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; league_id: string }) => {
      const { error } = await supabase.from("league_teams").delete().eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["league_teams", v.league_id] });
      qc.invalidateQueries({ queryKey: ["league_matches", v.league_id] });
    },
  });
}

export function useCreateLeagueMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      league_id: string;
      round: number;
      team_home_id: string;
      team_away_id: string;
    }) => {
      const { data, error } = await supabase
        .from("league_matches")
        .insert(params)
        .select()
        .single();
      if (error) throw error;
      return data as LeagueMatch;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["league_matches", v.league_id] }),
  });
}

export function useUpdateLeagueMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      league_id: string;
      score_home: number;
      score_away: number;
      status: string;
    }) => {
      const { error } = await supabase
        .from("league_matches")
        .update({
          score_home: params.score_home,
          score_away: params.score_away,
          status: params.status,
        })
        .eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["league_matches", v.league_id] }),
  });
}

export function useDeleteLeagueMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; league_id: string }) => {
      const { error } = await supabase.from("league_matches").delete().eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["league_matches", v.league_id] }),
  });
}
