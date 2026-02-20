import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { TeamShield } from "@/components/TeamShield";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Users, User2, X, Globe, ArrowUpRight, Gamepad2, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

// Tipos
interface Team {
  id: string;
  nome: string;
  slug: string;
  escudo_url: string | null;
  modalidade: string | null;
  faixa_etaria: string | null;
  cidade: string | null;
  uf: string | null;
  times: {
    cidade: string | null;
  }[];
  jogadores: { id: string }[];
}

interface Player {
  id: string;
  nome: string;
  apelido: string | null;
  posicao: string | null;
  foto_url: string | null;
  teams: {
    nome: string;
    slug: string;
    escudo_url: string | null;
    times: {
      cidade: string | null;
    }[];
  } | null;
}

export default function Discovery() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState("times");
  const { profile } = useAuth();

  // Local state for user's city to prioritize
  const [userCity, setUserCity] = useState<string | null>(null);

  // Filtros de Times
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterModalidade, setFilterModalidade] = useState<string>("all");
  const [filterFaixaEtaria, setFilterFaixaEtaria] = useState<string>("all");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch User's City - Busca da tabela teams (conta do time)
  useEffect(() => {
    const fetchUserCity = async () => {
      if (profile?.team_id) {
        const { data } = await supabase
          .from("teams")
          .select("cidade")
          .eq("id", profile.team_id)
          .maybeSingle();
        if (data?.cidade) {
            setUserCity(data.cidade);
        }
      }
    };
    fetchUserCity();
  }, [profile?.team_id]);

  // Query de Cidades
  const { data: cities } = useQuery({
    queryKey: ["discovery-cities"],
    queryFn: async () => {
      const { data } = await supabase
        .from("times")
        .select("cidade")
        .not("cidade", "is", null)
        .order("cidade");
      
      const uniqueCities = Array.from(new Set(data?.map(t => t.cidade).filter(Boolean)));
      return uniqueCities as string[];
    },
    staleTime: 1000 * 60 * 60,
  });

  // Query de Times com priorização por cidade do usuário
  const { data: teams, isLoading: loadingTeams } = useQuery({
    queryKey: ["discovery-teams", debouncedSearch, filterCity, filterModalidade, filterFaixaEtaria, userCity],
    queryFn: async () => {
      let query = supabase
        .from("teams")
        .select(`
          id, nome, slug, escudo_url, modalidade, faixa_etaria, cidade, uf,
          times(cidade),
          jogadores(id).eq(ativo, true)
        `);

      if (debouncedSearch) {
        query = query.ilike("nome", `%${debouncedSearch}%`);
      }

      const { data, error } = await query.order("nome").limit(100);
      
      if (error) {
        console.error("Error fetching teams:", error);
        return [];
      }

      let formattedData = (data as unknown as Team[]);

      // Client-side Filter by City (quando um filtro específico é selecionado)
      if (filterCity !== "all") {
        formattedData = formattedData.filter(team => {
            const teamCity = team.cidade || team.times?.[0]?.cidade;
            return teamCity === filterCity;
        });
      }

      // Client-side Filter by Modalidade
      if (filterModalidade !== "all") {
        formattedData = formattedData.filter(team => team.modalidade === filterModalidade);
      }

      // Client-side Filter by Faixa Etária
      if (filterFaixaEtaria !== "all") {
        formattedData = formattedData.filter(team => team.faixa_etaria === filterFaixaEtaria);
      }

      // SEPARAÇÃO: Times da mesma cidade vs outros
      if (userCity && filterCity === "all") {
        const sameCityTeams: Team[] = [];
        const otherTeams: Team[] = [];

        formattedData.forEach(team => {
          const teamCity = team.cidade || team.times?.[0]?.cidade;
          if (teamCity && teamCity.toLowerCase() === userCity.toLowerCase()) {
            sameCityTeams.push(team);
          } else {
            otherTeams.push(team);
          }
        });

        // Retorna primeiro os da mesma cidade, depois os outros
        return [...sameCityTeams, ...otherTeams];
      }

      return formattedData;
    },
    enabled: activeTab === "times",
  });

  // Query de Jogadores
  const { data: players, isLoading: loadingPlayers } = useQuery({
    queryKey: ["discovery-players", debouncedSearch],
    queryFn: async () => {
      let query = supabase
        .from("jogadores")
        .select(`
          id, nome, apelido, posicao, foto_url,
          teams:team_id(
            nome, slug, escudo_url,
            times(cidade)
          )
        `)
        .eq("ativo", true);

      if (debouncedSearch) {
        query = query.ilike("nome", `%${debouncedSearch}%`);
      }

      const { data, error } = await query.order("nome").limit(50);

      if (error) {
        console.error("Error fetching players:", error);
        return [];
      }
      return data as unknown as Player[];
    },
    enabled: activeTab === "jogadores",
  });

  const clearFilters = () => {
    setFilterCity("all");
    setFilterModalidade("all");
    setFilterFaixaEtaria("all");
    setSearchTerm("");
  };

  const hasActiveFilters = filterCity !== "all" || filterModalidade !== "all" || filterFaixaEtaria !== "all";

  return (
    <Layout>
      <div className="container py-8 px-4 md:px-6 min-h-[80vh]">
        {/* Header Section */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Globe className="h-8 w-8 text-primary" />
                Explorar
              </h1>
              <p className="text-muted-foreground">
                Encontre times e jogadores na maior rede do futebol amador.
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder={activeTab === "times" ? "Buscar times por nome..." : "Buscar jogadores por nome..."}
              className="pl-10 h-12 bg-black/20 backdrop-blur-md border-white/10 text-lg rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="times" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col space-y-4">
             {/* Tabs & Filters Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <TabsList className="bg-transparent p-0 h-auto justify-start border-b border-white/10 w-full md:w-auto rounded-none">
                <TabsTrigger 
                    value="times" 
                    className="px-0 py-2 mr-6 text-lg rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary font-bold"
                >
                    Times
                </TabsTrigger>
                <TabsTrigger 
                    value="jogadores"
                    className="px-0 py-2 text-lg rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary font-bold"
                >
                    Jogadores
                </TabsTrigger>
                </TabsList>

                {/* Filters (Only for Teams tab) */}
                {activeTab === "times" && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground mr-2 font-medium hidden md:block">Filtros:</span>
                    <Select value={filterCity} onValueChange={setFilterCity}>
                    <SelectTrigger className="w-[140px] h-9 bg-black/20 border-white/10 text-xs uppercase font-bold tracking-wider">
                        <SelectValue placeholder="CIDADE" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {cities?.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>

                    <Select value={filterModalidade} onValueChange={setFilterModalidade}>
                    <SelectTrigger className="w-[140px] h-9 bg-black/20 border-white/10 text-xs uppercase font-bold tracking-wider">
                        <SelectValue placeholder="MODALIDADE" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="society_7">Society 7x7</SelectItem>
                        <SelectItem value="society_5">Society 5x5</SelectItem>
                        <SelectItem value="campo_11">Campo 11x11</SelectItem>
                        <SelectItem value="futsal">Futsal</SelectItem>
                        <SelectItem value="beach">Beach Soccer</SelectItem>
                    </SelectContent>
                    </Select>

                    <Select value={filterFaixaEtaria} onValueChange={setFilterFaixaEtaria}>
                    <SelectTrigger className="w-[140px] h-9 bg-black/20 border-white/10 text-xs uppercase font-bold tracking-wider">
                        <SelectValue placeholder="FAIXA ETÁRIA" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="livre">Livre</SelectItem>
                        <SelectItem value="sub_20">Sub-20</SelectItem>
                        <SelectItem value="master_35">Master 35+</SelectItem>
                        <SelectItem value="master_40">Master 40+</SelectItem>
                        <SelectItem value="master_45">Master 45+</SelectItem>
                        <SelectItem value="master_50">Master 50+</SelectItem>
                    </SelectContent>
                    </Select>

                    {hasActiveFilters && (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={clearFilters}
                        className="h-9 w-9 text-muted-foreground hover:text-destructive"
                        title="Limpar filtros"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                    )}
                </div>
                )}
            </div>

            {/* Results Count & Proximity Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="text-sm text-muted-foreground">
                    {activeTab === "times" ? (
                    loadingTeams ? <Skeleton className="h-4 w-48" /> : 
                    <span>
                        <strong className="text-white">{teams?.length || 0} times encontrados</strong>
                        {filterCity !== 'all' && ` em ${filterCity}`}
                    </span>
                    ) : (
                    loadingPlayers ? <Skeleton className="h-4 w-48" /> :
                    <span><strong className="text-white">{players?.length || 0} jogadores encontrados</strong></span>
                    )}
                </div>
                
                {/* Badge de proximidade */}
                {activeTab === "times" && userCity && filterCity === 'all' && !loadingTeams && (
                    <Badge variant="outline" className="w-fit bg-primary/10 border-primary/30 text-primary text-xs">
                        <MapPin className="h-3 w-3 mr-1" />
                        Próximos a {userCity}
                    </Badge>
                )}
            </div>
          </div>

          {/* Times Content */}
          <TabsContent value="times" className="mt-0">
            {loadingTeams ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
              </div>
            ) : teams && teams.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {teams.map((team) => {
                  const totalJogadores = team.jogadores?.length || 0;
                  const cidade = team.cidade || team.times?.[0]?.cidade;
                  const isSameCity = userCity && cidade && cidade.toLowerCase() === userCity.toLowerCase();

                  return (
                    <Link key={team.id} to={`/explorar/time/${team.slug}`} className="block h-full">
                      <Card className={`h-full border rounded-xl hover:border-primary/50 transition-all group relative overflow-hidden ${
                        isSameCity 
                          ? 'bg-gradient-to-br from-primary/10 to-black/20 border-primary/30' 
                          : 'bg-black/20 border-white/10'
                      }`}>
                        {/* Badge de proximidade - posicionado no canto superior direito */}
                        {isSameCity && (
                          <div className="absolute top-3 right-3 z-10">
                            <Badge className="bg-primary text-white border-0 text-[10px] font-bold px-2 py-0.5 shadow-lg">
                              <MapPin className="h-3 w-3 mr-1" />
                              Próximo
                            </Badge>
                          </div>
                        )}
                        
                        <CardContent className="p-6">
                          <div className="flex gap-4">
                            <TeamShield 
                                escudoUrl={team.escudo_url} 
                                teamName={team.nome} 
                                size="lg" 
                                className="shadow-2xl"
                            />
                            
                            <div className="flex-1 space-y-2">
                                <div>
                                    <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors leading-tight">
                                        {team.nome}
                                    </h3>
                                    
                                    <div className={`flex items-center gap-2 text-sm mt-1 ${
                                      isSameCity ? 'text-primary font-medium' : 'text-muted-foreground'
                                    }`}>
                                        <MapPin className={`h-4 w-4 ${isSameCity ? 'text-primary' : 'text-primary'}`} />
                                        <span>{cidade || "Localização não definida"}</span>
                                        {isSameCity && <span className="text-xs text-primary/80">(sua cidade)</span>}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground/80 pt-2 border-t border-white/5">
                                    <div className="flex items-center gap-1.5">
                                        <Gamepad2 className="h-3.5 w-3.5" />
                                        <span>{team.modalidade || "Society 7x7"}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Trophy className="h-3.5 w-3.5" />
                                        <span>{team.faixa_etaria || "Livre"}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pt-2">
                                     <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                                        <Users className="h-4 w-4 text-primary" />
                                        {totalJogadores} <span className="text-muted-foreground font-normal">jogadores</span>
                                     </div>
                                </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (
             <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-black/20 rounded-3xl border border-white/5">
               <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center">
                 <Search className="h-8 w-8 text-muted-foreground" />
               </div>
               <div>
                 <h3 className="text-lg font-bold text-white">Nenhum time encontrado</h3>
                 <p className="text-muted-foreground max-w-xs mx-auto">
                   Tente ajustar os filtros ou buscar por outro nome.
                 </p>
               </div>
               {hasActiveFilters && (
                 <Button variant="outline" onClick={clearFilters}>
                   Limpar Filtros
                 </Button>
               )}
             </div>
            )}
          </TabsContent>

          {/* Jogadores Content */}
          <TabsContent value="jogadores" className="mt-0">
            {loadingPlayers ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
              </div>
            ) : players && players.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {players.map((player) => (
                  <Link key={player.id} to={`/explorar/jogador/${player.id}`}>
                    <Card className="h-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-primary/50 transition-all group">
                      <CardContent className="p-4 flex items-center gap-4">
                        <Avatar className="h-14 w-14 border-2 border-white/10 shadow-lg">
                          <AvatarImage src={player.foto_url || undefined} className="object-cover" />
                          <AvatarFallback className="bg-primary/20 text-primary font-bold">
                            {player.nome.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-white group-hover:text-primary transition-colors truncate">
                              {player.apelido || player.nome}
                            </h3>
                            {player.posicao && (
                              <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-primary/30 text-primary">
                                {player.posicao}
                              </Badge>
                            )}
                          </div>
                          
                          {player.teams ? (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <TeamShield 
                                escudoUrl={player.teams.escudo_url} 
                                teamName={player.teams.nome} 
                                size="xs" 
                                className="opacity-80" 
                              />
                              <span className="truncate">{player.teams.nome}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Sem time</span>
                          )}

                          {player.teams?.times?.[0]?.cidade && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground/70 pt-1">
                              <MapPin className="h-3 w-3" />
                              <span>{player.teams.times[0].cidade}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-black/20 rounded-3xl border border-white/5">
                <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center">
                  <User2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Nenhum jogador encontrado</h3>
                  <p className="text-muted-foreground">
                    Tente buscar por nome ou apelido.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
