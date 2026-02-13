import { useState, useEffect } from "react";
import { useEstatisticasPartida } from "@/hooks/useEstatisticas";
import { useCraqueVoting } from "@/hooks/useData";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Star, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface CraqueVotingProps {
  gameId: string;
  resultadoId: string;
  teamColor?: string;
}

export function CraqueVoting({ gameId, resultadoId, teamColor = "#22c55e" }: CraqueVotingProps) {
  const { data: stats, isLoading: isLoadingStats } = useEstatisticasPartida(resultadoId);
  const { data: votes, refetch: refetchVotes } = useCraqueVoting(gameId);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState<string | null>(null);
  const { toast } = useToast();

  // Simple Device Fingerprint (Client-side only)
  useEffect(() => {
    const votedGames = JSON.parse(localStorage.getItem("voted_games") || "[]");
    if (votedGames.includes(gameId)) {
      setHasVoted(true);
    }
  }, [gameId]);

  const getDeviceHash = () => {
    let hash = localStorage.getItem("device_hash");
    if (!hash) {
      hash = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("device_hash", hash);
    }
    return hash;
  };

  const handleVote = async (jogadorId: string) => {
    setIsVoting(jogadorId);
    const deviceHash = getDeviceHash();

    try {
      const { data, error } = await supabase.rpc("votar_craque" as any, {
        p_jogo_id: gameId,
        p_jogador_id: jogadorId,
        p_device_hash: deviceHash,
      });

      if (error) throw error;

      if (data && (data as any).success) {
        toast({
          title: "Voto computado com sucesso!",
          className: "bg-green-500 border-green-600 text-white",
        });
        
        // Update local storage
        const votedGames = JSON.parse(localStorage.getItem("voted_games") || "[]");
        localStorage.setItem("voted_games", JSON.stringify([...votedGames, gameId]));
        
        setHasVoted(true);
        refetchVotes();
      } else {
        const message = (data as any).message || "Erro ao votar.";
        toast({
          variant: "destructive",
          title: "Erro ao votar",
          description: message,
        });
        if ((data as any).message === 'Você já votou neste jogo.') {
           setHasVoted(true); // Sync state if backend says voted
        }
      }
    } catch (error) {
      console.error("Voting error:", error);
      toast({
        variant: "destructive",
        title: "Erro ao votar",
        description: "Tente novamente mais tarde.",
      });
    } finally {
      setIsVoting(null);
    }
  };

  if (isLoadingStats) {
    return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  // Determine list of playable players
  const playersToDisplay = stats || [];

  if (playersToDisplay.length === 0) {
    return <div className="text-center text-sm text-muted-foreground p-4">Nenhum jogador registrado nesta partida.</div>;
  }

  // Calculate percentages
  const totalVotes = votes?.reduce((acc, curr) => acc + curr.votos, 0) || 0;
  
  // Merge stats with votes and sorting
  const playersWithVotes = playersToDisplay.map(stat => {
    const voteCount = votes?.find(v => v.jogador_id === stat.jogador_id)?.votos || 0;
    return {
      ...stat,
      votes: voteCount,
      percentage: totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0
    };
  }).sort((a, b) => b.votes - a.votes);

  const topVotedId = totalVotes > 0 ? playersWithVotes[0].jogador_id : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          Craque da Galera
        </h3>
        <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
          {totalVotes} votos
        </span>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {playersWithVotes.map((player) => (
          <motion.div 
            key={player.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative p-3 rounded-lg border transition-all ${
              topVotedId === player.jogador_id && hasVoted ? "border-yellow-500/50 bg-yellow-500/10" : "border-border"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Avatar className="h-10 w-10 border-2 border-border">
                <AvatarImage src={player.jogador?.foto_url || undefined} />
                <AvatarFallback>{player.jogador?.nome?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm truncate">
                    {player.jogador?.apelido || player.jogador?.nome}
                    {topVotedId === player.jogador_id && hasVoted && (
                      <Trophy className="inline-block ml-2 h-3 w-3 text-yellow-500" />
                    )}
                  </p>
                  {hasVoted && (
                    <span className="text-xs font-bold">{player.votes} ({player.percentage.toFixed(0)}%)</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground capitalize">{player.jogador?.posicao}</p>
              </div>

              {!hasVoted && (
                <Button 
                  size="sm" 
                  variant="secondary"
                  className="h-8 text-xs shrink-0"
                  disabled={!!isVoting}
                  onClick={() => handleVote(player.jogador_id)}
                >
                  {isVoting === player.jogador_id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Votar"}
                </Button>
              )}
            </div>

            {hasVoted && (
              <Progress value={player.percentage} className="h-1.5 [&>div]:bg-green-500" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
