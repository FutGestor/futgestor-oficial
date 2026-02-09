import { useState, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables } from "@/integrations/supabase/types";

type LeagueMatch = Tables<"league_matches">;
type LeagueTeam = Tables<"league_teams">;

interface Props {
  matches: LeagueMatch[];
  teams: LeagueTeam[];
}

export function LeagueRoundMatches({ matches, teams }: Props) {
  const teamsMap = useMemo(() => {
    const map = new Map<string, LeagueTeam>();
    teams.forEach((t) => map.set(t.id, t));
    return map;
  }, [teams]);

  const rounds = useMemo(() => {
    const set = new Set<number>();
    matches.forEach((m) => set.add(m.round));
    return Array.from(set).sort((a, b) => a - b);
  }, [matches]);

  const [selectedRound, setSelectedRound] = useState<number>(() => {
    // Default to latest round that has results, or first round
    const played = matches.filter((m) => m.status === "finalizado");
    if (played.length > 0) {
      return Math.max(...played.map((m) => m.round));
    }
    return rounds[0] ?? 1;
  });

  const roundMatches = useMemo(
    () => matches.filter((m) => m.round === selectedRound),
    [matches, selectedRound]
  );

  if (rounds.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-muted-foreground">Jogos da Rodada</h4>
        <Select
          value={String(selectedRound)}
          onValueChange={(v) => setSelectedRound(Number(v))}
        >
          <SelectTrigger className="h-8 w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {rounds.map((r) => (
              <SelectItem key={r} value={String(r)}>
                Rodada {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {roundMatches.map((match) => {
          const home = teamsMap.get(match.team_home_id);
          const away = teamsMap.get(match.team_away_id);
          const isPlayed = match.score_home !== null && match.score_away !== null;

          return (
            <div
              key={match.id}
              className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
            >
              {/* Home team */}
              <div className="flex flex-1 items-center justify-end gap-1.5 min-w-0">
                <span className="truncate text-xs sm:text-sm font-medium text-right">{home?.name ?? "?"}</span>
                <Avatar className="h-5 w-5 sm:h-6 sm:w-6 shrink-0">
                  <AvatarImage src={home?.logo_url ?? undefined} />
                  <AvatarFallback className="text-[8px] sm:text-[10px]">
                    {home?.name?.substring(0, 2).toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Score */}
              <div className="shrink-0 px-1 sm:px-2 text-center min-w-[44px]">
                {isPlayed ? (
                  <span className="text-sm sm:text-base font-bold whitespace-nowrap">
                    {match.score_home} x {match.score_away}
                  </span>
                ) : (
                  <Badge variant="secondary" className="text-xs">vs</Badge>
                )}
              </div>

              {/* Away team */}
              <div className="flex flex-1 items-center gap-1.5 min-w-0">
                <Avatar className="h-5 w-5 sm:h-6 sm:w-6 shrink-0">
                  <AvatarImage src={away?.logo_url ?? undefined} />
                  <AvatarFallback className="text-[8px] sm:text-[10px]">
                    {away?.name?.substring(0, 2).toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-xs sm:text-sm font-medium">{away?.name ?? "?"}</span>
              </div>
            </div>
          );
        })}

        {roundMatches.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhum jogo nesta rodada.
          </p>
        )}
      </div>
    </div>
  );
}
