import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRightLeft, TrendingUp, Users, Trophy, Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function TransferenciaDetalhe() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const jogadorId = searchParams.get("jogador");

  const { data: jogador, isLoading } = useQuery({
    queryKey: ["transferencia-jogador", jogadorId],
    enabled: !!jogadorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jogadores")
        .select(`
          *,
          team:team_id(
            id,
            nome,
            slug,
            escudo_url,
            cidade,
            estado
          )
        `)
        .eq("id", jogadorId)
        .single();

      if (error) throw error;
      return data as any;
    },
  });

  // Buscar estatísticas do jogador
  const { data: stats } = useQuery({
    queryKey: ["jogador-stats-transferencia", jogadorId],
    enabled: !!jogadorId,
    queryFn: async () => {
      // Jogos
      const { count: jogos } = await supabase
        .from("presencas")
        .select("*", { count: "exact", head: true })
        .eq("jogador_id", jogadorId)
        .eq("presente", true);

      // Gols
      // @ts-expect-error
      const { data: golsData } = await supabase
        // @ts-expect-error
        .from("gols")
        .select("id")
        .eq("jogador_id", jogadorId);

      return {
        jogos: jogos || 0,
        gols: golsData?.length || 0,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f172a] to-[#1a1a2e] flex items-center justify-center">
        <div className="animate-pulse text-primary">Carregando...</div>
      </div>
    );
  }

  if (!jogador) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f172a] to-[#1a1a2e] p-4">
        <div className="max-w-md mx-auto pt-8 text-center">
          <h1 className="text-xl font-bold text-white mb-2">Jogador não encontrado</h1>
          <Button onClick={() => navigate(-1)}>Voltar</Button>
        </div>
      </div>
    );
  }

  const time = jogador.team;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f172a] to-[#1a1a2e] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-md mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Header da Transferência */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full">
            <ArrowRightLeft className="h-4 w-4 text-green-400" />
            <span className="text-sm font-bold text-green-400 uppercase tracking-wider">Transferência Confirmada</span>
          </div>
          
          <h1 className="text-3xl font-black uppercase italic text-white">
            Reforço de Peso!
          </h1>
          <p className="text-muted-foreground">
            Contratação de peso para fortalecer o elenco
          </p>
        </div>

        {/* Card do Jogador */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 overflow-hidden">
          <CardContent className="p-6 text-center space-y-4">
            <Avatar className="h-28 w-28 mx-auto border-4 border-primary/30 shadow-2xl shadow-primary/20">
              <AvatarImage src={jogador.foto_url} className="object-cover" />
              <AvatarFallback className="bg-primary/20 text-primary text-4xl font-black">
                {jogador.nome?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h2 className="text-2xl font-black uppercase italic text-white">{jogador.nome}</h2>
              {jogador.apelido && (
                <p className="text-lg text-primary font-semibold">"{jogador.apelido}"</p>
              )}
              {jogador.posicao && (
                <Badge className="mt-2 bg-primary/20 text-primary border-primary/30">
                  {jogador.posicao}
                </Badge>
              )}
            </div>

            {/* Estatísticas do Jogador */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-black/40 rounded-lg p-3">
                <div className="text-2xl font-black text-white">{stats?.jogos || 0}</div>
                <div className="text-xs text-muted-foreground">Jogos</div>
              </div>
              <div className="bg-black/40 rounded-lg p-3">
                <div className="text-2xl font-black text-white">{stats?.gols || 0}</div>
                <div className="text-xs text-muted-foreground">Gols</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seta indicando transferência */}
        <div className="flex items-center justify-center gap-4 py-2">
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Time Anterior</p>
            <p className="text-sm text-white font-semibold">{jogador.time_anterior_nome || "—"}</p>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
          <ArrowRightLeft className="h-6 w-6 text-primary" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Novo Time</p>
            <p className="text-sm text-white font-semibold">{time?.nome}</p>
          </div>
        </div>

        {/* Card do Novo Time */}
        <Card className="bg-black/40 border-white/10">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-white/10">
                <AvatarImage src={time?.escudo_url} />
                <AvatarFallback className="bg-primary/20 text-primary text-xl">
                  {time?.nome?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{time?.nome}</h3>
                {(time?.cidade || time?.estado) && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {time?.cidade}{time?.cidade && time?.estado && ", "}{time?.estado}
                  </p>
                )}
              </div>
            </div>

            <Button 
              className="w-full mt-4" 
              onClick={() => navigate(`/explorar/time/${time?.slug}`)}
            >
              Ver Perfil do Time
            </Button>
          </CardContent>
        </Card>

        {/* Mensagem de Boas-vindas */}
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30">
          <CardContent className="p-5 text-center space-y-3">
            <TrendingUp className="h-8 w-8 text-green-400 mx-auto" />
            <h3 className="text-lg font-black uppercase italic text-white">
              Bem-vindo ao time!
            </h3>
            <p className="text-sm text-muted-foreground">
              {jogador.nome} agora faz parte do elenco do {time?.nome}. 
              Grande contratação para fortalecer o time na próxima temporada!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
