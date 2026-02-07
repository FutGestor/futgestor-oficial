import { Target, Users } from "lucide-react";
import type { EstatisticasJogador } from "@/lib/types";

interface JogadorStatsProps {
  stats: EstatisticasJogador | undefined;
}

export function JogadorStats({ stats }: JogadorStatsProps) {
  if (!stats || stats.jogos === 0) {
    return (
      <div className="mt-3 border-t pt-3 text-center text-sm text-muted-foreground">
        Sem estatísticas ainda
      </div>
    );
  }

  return (
    <div className="mt-3 grid grid-cols-4 gap-2 border-t pt-3 text-center text-xs">
      <div>
        <div className="flex items-center justify-center gap-1 font-semibold text-primary">
          <Users className="h-3 w-3" />
          {stats.jogos}
        </div>
        <div className="text-muted-foreground">Jogos</div>
      </div>
      <div>
        <div className="flex items-center justify-center gap-1 font-semibold text-green-600">
          <Target className="h-3 w-3" />
          {stats.gols}
        </div>
        <div className="text-muted-foreground">Gols</div>
      </div>
      <div>
        <div className="flex items-center justify-center gap-1 font-semibold text-blue-600">
          🎯
          {stats.assistencias}
        </div>
        <div className="text-muted-foreground">Assist.</div>
      </div>
      <div>
        <div className="flex items-center justify-center gap-1 font-semibold">
          <span className="text-yellow-500">🟨</span>
          {stats.cartoes_amarelos}
          <span className="text-red-500">🟥</span>
          {stats.cartoes_vermelhos}
        </div>
        <div className="text-muted-foreground">Cartões</div>
      </div>
    </div>
  );
}
