import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { supabase } from "@/integrations/supabase/client";
import { ManagementHeader } from "@/components/layout/ManagementHeader";
import { Layout } from "@/components/layout/Layout";
import { LeagueStandingsTable } from "@/components/LeagueStandingsTable";
import {
  useLeague,
  useLeagueTeams,
  useLeagueMatches,
  useCreateLeagueTeam,
  useUpdateLeagueTeam,
  useDeleteLeagueTeam,
  useCreateLeagueMatch,
  useUpdateLeagueMatch,
  useDeleteLeagueMatch,
  computeStandings,
  type LeagueMatch,
  type LeagueTeam,
} from "@/hooks/useLeagues";

// ─── Tab: Times ───
function TimesTab({ leagueId }: { leagueId: string }) {
  const { data: teams, isLoading } = useLeagueTeams(leagueId);
  const createTeam = useCreateLeagueTeam();
  const updateTeam = useUpdateLeagueTeam();
  const deleteTeam = useDeleteLeagueTeam();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Edit state
  const [editTeam, setEditTeam] = useState<LeagueTeam | null>(null);
  const [editName, setEditName] = useState("");
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);

  const uploadLogo = async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `league-teams/${leagueId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("times").upload(path, file);
    if (upErr) throw upErr;
    const { data: pub } = supabase.storage.from("times").getPublicUrl(path);
    return pub.publicUrl;
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      let logo_url: string | undefined;
      if (logoFile) {
        logo_url = await uploadLogo(logoFile);
      }
      await createTeam.mutateAsync({ league_id: leagueId, name: name.trim(), logo_url });
      toast({ title: "Time adicionado!" });
      setName(""); setLogoFile(null); setDialogOpen(false);
    } catch {
      toast({ variant: "destructive", title: "Erro ao adicionar time" });
    }
  };

  const openEdit = (t: LeagueTeam) => {
    setEditTeam(t);
    setEditName(t.name);
    setEditLogoFile(null);
  };

  const handleEdit = async () => {
    if (!editTeam || !editName.trim()) return;
    try {
      let logo_url: string | null | undefined = editTeam.logo_url;
      if (editLogoFile) {
        logo_url = await uploadLogo(editLogoFile);
      }
      await updateTeam.mutateAsync({ id: editTeam.id, league_id: leagueId, name: editName.trim(), logo_url });
      toast({ title: "Time atualizado!" });
      setEditTeam(null);
    } catch {
      toast({ variant: "destructive", title: "Erro ao atualizar time" });
    }
  };

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Adicionar Time
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Time</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Nome do time" value={name} onChange={(e) => setName(e.target.value)} />
            <div>
              <label className="mb-1 block text-sm font-medium">Escudo (opcional)</label>
              <Input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleCreate} disabled={!name.trim() || createTeam.isPending}>
              {createTeam.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit team dialog */}
      <Dialog open={!!editTeam} onOpenChange={(o) => !o && setEditTeam(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Time</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Nome do time" value={editName} onChange={(e) => setEditName(e.target.value)} />
            <div>
              <label className="mb-1 block text-sm font-medium">Escudo (trocar)</label>
              <Input type="file" accept="image/*" onChange={(e) => setEditLogoFile(e.target.files?.[0] ?? null)} />
              {editTeam?.logo_url && !editLogoFile && (
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={editTeam.logo_url} />
                    <AvatarFallback>{editTeam.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span>Escudo atual</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleEdit} disabled={!editName.trim() || updateTeam.isPending}>
              {updateTeam.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {teams && teams.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">Nenhum time cadastrado. Adicione times para começar.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {teams?.map((t) => (
          <Card key={t.id} className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={t.logo_url ?? undefined} />
                  <AvatarFallback>{t.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{t.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  onClick={() => openEdit(t)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir "{t.name}"?</AlertDialogTitle>
                      <AlertDialogDescription>Jogos deste time também serão removidos.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteTeam.mutate({ id: t.id, league_id: leagueId })}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Jogos ───
function JogosTab({ leagueId }: { leagueId: string }) {
  const { data: matches, isLoading: mLoading } = useLeagueMatches(leagueId);
  const { data: teams } = useLeagueTeams(leagueId);
  const createMatch = useCreateLeagueMatch();
  const updateMatch = useUpdateLeagueMatch();
  const deleteMatch = useDeleteLeagueMatch();
  const { toast } = useToast();

  const [addOpen, setAddOpen] = useState(false);
  const [homeId, setHomeId] = useState("");
  const [awayId, setAwayId] = useState("");
  const [round, setRound] = useState("1");

  const [editMatch, setEditMatch] = useState<LeagueMatch | null>(null);
  const [scoreH, setScoreH] = useState("0");
  const [scoreA, setScoreA] = useState("0");

  const teamMap = new Map(teams?.map(t => [t.id, t]) ?? []);

  const handleAddMatch = async () => {
    if (!homeId || !awayId || homeId === awayId) {
      toast({ variant: "destructive", title: "Selecione dois times diferentes" });
      return;
    }
    try {
      await createMatch.mutateAsync({ league_id: leagueId, round: parseInt(round), team_home_id: homeId, team_away_id: awayId });
      toast({ title: "Jogo adicionado!" });
      setAddOpen(false); setHomeId(""); setAwayId("");
    } catch {
      toast({ variant: "destructive", title: "Erro ao adicionar jogo" });
    }
  };

  const handleSaveScore = async () => {
    if (!editMatch) return;
    try {
      await updateMatch.mutateAsync({
        id: editMatch.id,
        league_id: leagueId,
        score_home: parseInt(scoreH),
        score_away: parseInt(scoreA),
        status: "finalizado",
      });
      toast({ title: "Placar salvo!" });
      setEditMatch(null);
    } catch {
      toast({ variant: "destructive", title: "Erro ao salvar placar" });
    }
  };

  const openEdit = (m: LeagueMatch) => {
    setEditMatch(m);
    setScoreH(String(m.score_home ?? 0));
    setScoreA(String(m.score_away ?? 0));
  };

  if (mLoading) return <Skeleton className="h-40 w-full" />;

  // Group by round
  const rounds = new Map<number, LeagueMatch[]>();
  for (const m of matches ?? []) {
    const list = rounds.get(m.round) ?? [];
    list.push(m);
    rounds.set(m.round, list);
  }


  // Filter available teams for the current round
  const currentRound = parseInt(round) || 1;
  const busyTeamIds = new Set<string>();
  
  if (matches) {
    for (const m of matches) {
      if (m.round === currentRound) {
        busyTeamIds.add(m.team_home_id);
        busyTeamIds.add(m.team_away_id);
      }
    }
  }

  // A team is available if:
  // 1. It is NOT in the busy list for this round
  // OR
  // 2. It is already selected in one of the inputs (so we don't hide the current selection)
  const availableTeams = teams?.filter(t => !busyTeamIds.has(t.id) || t.id === homeId || t.id === awayId);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="gap-2" onClick={() => setAddOpen(true)} disabled={!teams || teams.length < 2}>
          <Plus className="h-4 w-4" /> Adicionar Jogo
        </Button>
      </div>

      {/* Add match dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Jogo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Rodada</label>
              <Input type="number" min={1} value={round} onChange={(e) => setRound(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Time Casa</label>
              <Select value={homeId} onValueChange={setHomeId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{availableTeams?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Time Visitante</label>
              <Select value={awayId} onValueChange={setAwayId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{availableTeams?.filter(t => t.id !== homeId).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleAddMatch} disabled={createMatch.isPending}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit score dialog */}
      <Dialog open={!!editMatch} onOpenChange={(o) => !o && setEditMatch(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Placar</DialogTitle></DialogHeader>
          {editMatch && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="mb-2 text-sm font-medium">{teamMap.get(editMatch.team_home_id)?.name}</p>
                  <Input type="number" min={0} className="w-20 text-center text-2xl" value={scoreH} onChange={(e) => setScoreH(e.target.value)} />
                </div>
                <span className="text-2xl font-bold text-muted-foreground">×</span>
                <div className="text-center">
                  <p className="mb-2 text-sm font-medium">{teamMap.get(editMatch.team_away_id)?.name}</p>
                  <Input type="number" min={0} className="w-20 text-center text-2xl" value={scoreA} onChange={(e) => setScoreA(e.target.value)} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleSaveScore} disabled={updateMatch.isPending}>
              {updateMatch.isPending ? "Salvando..." : "Finalizar Jogo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {rounds.size === 0 && (
        <p className="py-8 text-center text-muted-foreground">Nenhum jogo cadastrado.</p>
      )}

      {Array.from(rounds.entries())
        .sort(([a], [b]) => a - b)
        .map(([roundNum, roundMatches]) => (
          <Card key={roundNum} className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardHeader className="px-3 py-2 sm:px-6 sm:py-4">
              <CardTitle className="text-sm sm:text-base">Rodada {roundNum}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 px-2 pb-3 sm:space-y-2 sm:px-6 sm:pb-6">
              {roundMatches.map((m) => {
                const home = teamMap.get(m.team_home_id);
                const away = teamMap.get(m.team_away_id);
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-1 sm:gap-2 rounded-lg border p-2 sm:p-3 transition-colors hover:bg-muted/50 cursor-pointer overflow-hidden"
                    onClick={() => openEdit(m)}
                  >
                    {/* Home */}
                    <div className="flex flex-1 items-center justify-end gap-1 min-w-0">
                      <span className="truncate text-xs sm:text-sm font-medium text-right">{home?.name ?? "?"}</span>
                      <Avatar className="h-5 w-5 sm:h-6 sm:w-6 shrink-0">
                        <AvatarImage src={home?.logo_url ?? undefined} />
                        <AvatarFallback className="text-[10px]">{home?.name?.substring(0, 2).toUpperCase() ?? "?"}</AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Score */}
                    <div className="shrink-0 px-0.5 sm:px-1 text-center">
                      {m.status === "finalizado" ? (
                        <span className="text-sm sm:text-base font-bold whitespace-nowrap">{m.score_home}×{m.score_away}</span>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5">vs</Badge>
                      )}
                    </div>

                    {/* Away */}
                    <div className="flex flex-1 items-center gap-1 min-w-0">
                      <Avatar className="h-5 w-5 sm:h-6 sm:w-6 shrink-0">
                        <AvatarImage src={away?.logo_url ?? undefined} />
                        <AvatarFallback className="text-[8px] sm:text-[10px]">{away?.name?.substring(0, 2).toUpperCase() ?? "?"}</AvatarFallback>
                      </Avatar>
                      <span className="truncate text-xs sm:text-sm font-medium">{away?.name ?? "?"}</span>
                    </div>

                    {/* Delete */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir este jogo?</AlertDialogTitle>
                          <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMatch.mutate({ id: m.id, league_id: leagueId })}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
    </div>
  );
}

// ─── Main Detail Page ───
export default function AdminCampeonatoDetalhe() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const navigate = useNavigate();
  const { basePath } = useTeamSlug();
  const { data: league, isLoading: lLoading } = useLeague(leagueId);
  const { data: teams } = useLeagueTeams(leagueId);
  const { data: matches } = useLeagueMatches(leagueId);

  const standings = computeStandings(teams ?? [], matches ?? []);

  if (lLoading) return <Skeleton className="h-10 w-64" />;

  return (
    <Layout>
      <div className="space-y-6 container py-8 px-4 md:px-6">
        <ManagementHeader 
          title={league?.name || "Campeonato"} 
          subtitle="Gerencie times, rodadas e acompanhe a classificação." 
        />
  
        <Tabs defaultValue="classificacao">
          <TabsList className="bg-black/40 border border-white/10 backdrop-blur-xl p-1 rounded-xl h-auto">
            <TabsTrigger 
              value="classificacao" 
              className="data-[state=active]:bg-primary data-[state=active]:text-black font-bold py-2 px-4 rounded-lg"
            >
              Classificação
            </TabsTrigger>
            <TabsTrigger 
              value="jogos"
              className="data-[state=active]:bg-primary data-[state=active]:text-black font-bold py-2 px-4 rounded-lg"
            >
              Jogos / Rodadas
            </TabsTrigger>
            <TabsTrigger 
              value="times"
              className="data-[state=active]:bg-primary data-[state=active]:text-black font-bold py-2 px-4 rounded-lg"
            >
              Times
            </TabsTrigger>
          </TabsList>
  
          <TabsContent value="classificacao" className="mt-6">
            <Card className="bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
              <CardContent className="p-0 sm:p-4">
                <LeagueStandingsTable standings={standings} />
              </CardContent>
            </Card>
          </TabsContent>
  
          <TabsContent value="jogos" className="mt-6">
            <JogosTab leagueId={leagueId!} />
          </TabsContent>
  
          <TabsContent value="times" className="mt-6">
            <TimesTab leagueId={leagueId!} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
