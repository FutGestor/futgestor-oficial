import { Layout } from "@/components/layout/Layout";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { useLeagues, useLeagueTeams, useLeagueMatches, computeStandings } from "@/hooks/useLeagues";
import { LeagueStandingsTable } from "@/components/LeagueStandingsTable";
import { LeagueRoundMatches } from "@/components/LeagueRoundMatches";
import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function LeagueCard({ leagueId, leagueName }: { leagueId: string; leagueName: string }) {
  const { data: teams } = useLeagueTeams(leagueId);
  const { data: matches } = useLeagueMatches(leagueId);
  const standings = computeStandings(teams ?? [], matches ?? []);

  if (!teams || teams.length === 0) return null;

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Trophy className="h-5 w-5 text-foreground" />
          {leagueName}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-4">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
          <div className="overflow-x-auto">
            <LeagueStandingsTable standings={standings} compact />
          </div>
          {matches && matches.length > 0 && teams && (
            <div className="min-w-[260px] lg:max-w-[320px]">
              <LeagueRoundMatches matches={matches} teams={teams} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function LigasPage() {
  const { team } = useTeamSlug();
  const { data: leagues } = useLeagues(team.id);

  return (
    <Layout>
      <div className="container py-8 px-4 md:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Campeonatos</h1>
          <p className="text-muted-foreground">Acompanhe os campeonatos do time</p>
        </div>
        {leagues && leagues.length > 0 ? (
          <div className="grid gap-6">
            {leagues.map((l) => (
              <LeagueCard key={l.id} leagueId={l.id} leagueName={l.name} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum campeonato cadastrado no momento.
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
