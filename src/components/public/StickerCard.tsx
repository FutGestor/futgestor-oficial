import { Jogador } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";

interface StickerCardProps {
  jogador: Jogador | any; // Any for public player compatibility
  stats?: {
    jogos: number;
    gols: number;
    assistencias: number;
    mvp?: number;
  };
  className?: string;
  variant?: "gold" | "silver" | "bronze";
}

export function StickerCard({ jogador, stats, className, variant = "gold" }: StickerCardProps) {
  const variants = {
    gold: "bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 border-yellow-500",
    silver: "bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 border-gray-400",
    bronze: "bg-gradient-to-br from-orange-200 via-orange-400 to-orange-600 border-orange-500",
  };

  const textColors = {
    gold: "text-yellow-900",
    silver: "text-gray-900",
    bronze: "text-orange-950",
  };

  const getBaseStats = (pos: string) => {
    switch (pos?.toLowerCase()) {
      case 'atacante': return { pac: 90, sho: 90, pas: 80, dri: 95 };
      case 'lateral': return { pac: 80, sho: 70, pas: 85, dri: 80 };
      case 'meia': return { pac: 85, sho: 95, pas: 95, dri: 95 };
      case 'volante': return { pac: 78, sho: 75, pas: 88, dri: 90 };
      case 'zagueiro': return { pac: 75, sho: 70, pas: 78, dri: 80 };
      case 'goleiro': return { pac: 70, sho: 65, pas: 75, dri: 80 }; // Maps to DIV, HAN, KIC, REF
      default: return { pac: 70, sho: 60, pas: 60, dri: 60 };
    }
  };

  const base = getBaseStats(jogador.posicao);

  return (
    <div className={cn(
      "relative w-48 h-72 rounded-t-2xl rounded-b-lg p-2 flex flex-col items-center select-none shadow-xl border-2 transition-transform hover:scale-105",
      variants[variant],
      className
    )}>
      {/* Top Info */}
      <div className={cn("self-start flex flex-col leading-none font-bold text-lg", textColors[variant])}>
        <span>99</span>
        <span className="text-xs uppercase">{jogador.posicao?.substring(0, 3)}</span>
      </div>

      {/* Player Image */}
      <div className="w-28 h-28 my-2 relative">
         {jogador.foto_url ? (
            <img src={jogador.foto_url} alt={jogador.nome} className="w-full h-full object-cover rounded-full border-2 border-white/50 shadow-inner" />
         ) : (
            <div className="w-full h-full bg-black/10 rounded-full flex items-center justify-center border-2 border-white/50">
               <Shield className="w-12 h-12 opacity-20" />
            </div>
         )}
      </div>

      {/* Name */}
      <div className="text-center w-full mb-2">
        <h3 className={cn("font-bold text-lg uppercase truncate leading-tight", textColors[variant])}>
          {jogador.apelido || jogador.nome}
        </h3>
        <div className="h-0.5 w-full bg-black/10 my-1" />
      </div>

      {/* Stats Grid */}
      <div className={cn("grid grid-cols-2 gap-x-6 text-xs w-full px-5 mt-1", textColors[variant])}>
        {jogador.posicao === 'goleiro' ? (
          <>
            <div className="flex flex-col space-y-0.5">
              <div className="flex items-center justify-start gap-2">
                <span className="font-bold w-5 text-end">{Math.min(99, base.pac + (stats?.jogos || 0))}</span>
                <span className="opacity-80 font-medium">DIV</span>
              </div>
              <div className="flex items-center justify-start gap-2">
                <span className="font-bold w-5 text-end">{Math.min(99, base.sho + (stats?.jogos || 0))}</span>
                <span className="opacity-80 font-medium">HAN</span>
              </div>
              <div className="flex items-center justify-start gap-2">
                <span className="font-bold w-5 text-end">{Math.min(99, base.pas + (stats?.assistencias || 0) * 5)}</span>
                <span className="opacity-80 font-medium">KIC</span>
              </div>
            </div>
            <div className="flex flex-col space-y-0.5 border-l border-black/10 pl-2">
              <div className="flex items-center justify-start gap-2">
                 <span className="font-bold w-5 text-end">{Math.min(99, base.dri + (stats?.mvp || 0) * 2)}</span>
                 <span className="opacity-80 font-medium">REF</span>
              </div>
              <div className="flex items-center justify-start gap-2">
                <span className="font-bold w-5 text-end">45</span>
                <span className="opacity-80 font-medium">SPD</span>
              </div>
              <div className="flex items-center justify-start gap-2">
                 <span className="font-bold w-5 text-end">80</span>
                 <span className="opacity-80 font-medium">POS</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col space-y-0.5">
              <div className="flex items-center justify-start gap-2">
                <span className="font-bold w-5 text-end">{Math.min(99, base.pac + (stats?.jogos || 0))}</span>
                <span className="opacity-80 font-medium">PAC</span>
              </div>
              <div className="flex items-center justify-start gap-2">
                <span className="font-bold w-5 text-end">{Math.min(99, base.sho + (stats?.gols || 0) * 3)}</span>
                <span className="opacity-80 font-medium">SHO</span>
              </div>
              <div className="flex items-center justify-start gap-2">
                <span className="font-bold w-5 text-end">{Math.min(99, base.pas + (stats?.assistencias || 0) * 3)}</span>
                <span className="opacity-80 font-medium">PAS</span>
              </div>
            </div>
            <div className="flex flex-col space-y-0.5 border-l border-black/10 pl-2">
              <div className="flex items-center justify-start gap-2">
                 <span className="font-bold w-5 text-end">{Math.min(99, base.dri + (stats?.assistencias || 0) * 2)}</span>
                 <span className="opacity-80 font-medium">DRI</span>
              </div>
              <div className="flex items-center justify-start gap-2">
                <span className="font-bold w-5 text-end">{jogador.posicao === 'zagueiro' ? 85 : (jogador.posicao === 'volante' ? 75 : 40)}</span>
                <span className="opacity-80 font-medium">DEF</span>
              </div>
              <div className="flex items-center justify-start gap-2">
                 <span className="font-bold w-5 text-end">{jogador.posicao === 'zagueiro' ? 82 : 70}</span>
                 <span className="opacity-80 font-medium">PHY</span>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Bottom Decoration */}
      <div className="mt-auto mb-1">
        <Shield className={cn("w-4 h-4 opacity-50", textColors[variant])} />
      </div>
    </div>
  );
}
