import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { useLeagues, useLeagueTeams, useLeagueMatches, computeStandings } from "@/hooks/useLeagues";
import { LeagueStandingsTable } from "@/components/LeagueStandingsTable";
import { LeagueRoundMatches } from "@/components/LeagueRoundMatches";
import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function LeagueCard({ leagueId, leagueName }: { leagueId: string; leagueName: string }) {
  const { data: teams } = useLeagueTeams(leagueId);
  const { data: matches } = useLeagueMatches(leagueId);
  const standings = computeStandings(teams ?? [], matches ?? []);

  if (!teams || teams.length === 0) return null;

  return (
    <Card className="bg-card border-none shadow-none sm:border sm:shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Trophy className="h-5 w-5 text-primary" />
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
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");

  useEffect(() => {
    if (leagues && leagues.length > 0) {
      // Se não tiver selecionado ou se o selecionado não existir mais na lista, seleciona o primeiro
      if (!selectedLeagueId || !leagues.find(l => l.id === selectedLeagueId)) {
        setSelectedLeagueId(leagues[0].id);
      }
    }
  }, [leagues, selectedLeagueId]);

  const selectedLeague = leagues?.find(l => l.id === selectedLeagueId);

  return (
    <Layout>
      <div className="container py-8 px-4 md:px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Campeonatos</h1>
          <p className="text-muted-foreground">Acompanhe os campeonatos do time</p>
        </div>

        {leagues && leagues.length > 0 ? (
          <div className="space-y-6">
            {/* Selector - Only show if more than 1 league */}
            {leagues.length > 1 && (
              <Tabs 
                value={selectedLeagueId} 
                onValueChange={setSelectedLeagueId} 
                className="w-full"
              >
                <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/50">
                  {leagues.map((l) => (
                    <TabsTrigger 
                      key={l.id} 
                      value={l.id}
                      className="min-w-[100px]"
                    >
                      {l.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}

            {/* Selected League Content */}
            {selectedLeague && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <LeagueCard 
                  key={selectedLeague.id} 
                  leagueId={selectedLeague.id} 
                  leagueName={selectedLeague.name} 
                />
              </div>
            )}
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
