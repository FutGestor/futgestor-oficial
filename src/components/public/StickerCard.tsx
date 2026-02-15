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
  size?: "sm" | "md" | "lg";
}

export function StickerCard({ jogador, stats, className, variant = "gold", size = "md" }: StickerCardProps) {
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

  const sizes = {
    sm: {
      container: "w-14 h-22 p-1 rounded-t-xl rounded-b-md border",
      rating: "text-[10px]",
      pos: "text-[6px]",
      img: "w-8 h-8",
      name: "text-[8px] mb-0.5",
      stats: "text-[5px] px-1 gap-x-1",
      icon: "w-2 h-2"
    },
    md: {
      container: "w-40 h-60 p-2 rounded-t-2xl rounded-b-lg border-2",
      rating: "text-base",
      pos: "text-[10px]",
      img: "w-24 h-24",
      name: "text-sm",
      stats: "text-[10px] px-3 gap-x-4",
      icon: "w-3 h-3"
    },
    lg: {
      container: "w-48 h-72 p-2 rounded-t-2xl rounded-b-lg border-2",
      rating: "text-lg",
      pos: "text-xs",
      img: "w-28 h-28",
      name: "text-lg",
      stats: "text-xs px-5 gap-x-6",
      icon: "w-4 h-4"
    }
  };

  const currentSize = sizes[size];

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
      "relative flex flex-col items-center select-none shadow-xl transition-transform",
      currentSize.container,
      variants[variant],
      className
    )}>
      {/* Top Info */}
      <div className={cn("self-start flex flex-col leading-none font-bold", currentSize.rating, textColors[variant])}>
        <span>99</span>
        <span className={cn("uppercase", currentSize.pos)}>{jogador.posicao?.substring(0, 3)}</span>
      </div>

      {/* Player Image */}
      <div className={cn("my-1 relative", currentSize.img)}>
         {jogador.foto_url ? (
            <img src={jogador.foto_url} alt={jogador.nome} className="w-full h-full object-cover rounded-full border border-white/50 shadow-inner" />
         ) : (
            <div className="w-full h-full bg-black/10 rounded-full flex items-center justify-center border border-white/50">
               <Shield className="w-1/2 h-1/2 opacity-20" />
            </div>
         )}
      </div>

      {/* Name */}
      <div className="text-center w-full mb-1">
        <h3 className={cn("font-bold uppercase truncate leading-tight", currentSize.name, textColors[variant])}>
          {jogador.apelido || jogador.nome}
        </h3>
        <div className="h-[1px] w-full bg-black/10 my-0.5" />
      </div>

      {/* Stats Grid */}
      <div className={cn("grid grid-cols-2 text-center w-full mt-0.5", currentSize.stats, textColors[variant])}>
        {jogador.posicao === 'goleiro' ? (
          <>
            <div className="flex flex-col">
              <div className="flex items-center justify-center gap-1">
                <span className="font-bold">{Math.min(99, base.pac + (stats?.jogos || 0))}</span>
                <span className="opacity-80">DIV</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <span className="font-bold">{Math.min(99, base.sho + (stats?.jogos || 0))}</span>
                <span className="opacity-80">HAN</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <span className="font-bold">{Math.min(99, base.pas + (stats?.assistencias || 0) * 5)}</span>
                <span className="opacity-80">KIC</span>
              </div>
            </div>
            <div className="flex flex-col border-l border-black/10">
              <div className="flex items-center justify-center gap-1">
                 <span className="font-bold">{Math.min(99, base.dri + (stats?.mvp || 0) * 2)}</span>
                 <span className="opacity-80">REF</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <span className="font-bold">45</span>
                <span className="opacity-80">SPD</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                 <span className="font-bold">80</span>
                 <span className="opacity-80">POS</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col">
              <div className="flex items-center justify-center gap-1">
                <span className="font-bold">{Math.min(99, base.pac + (stats?.jogos || 0))}</span>
                <span className="opacity-80">PAC</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <span className="font-bold">{Math.min(99, base.sho + (stats?.gols || 0) * 3)}</span>
                <span className="opacity-80">SHO</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <span className="font-bold">{Math.min(99, base.pas + (stats?.assistencias || 0) * 3)}</span>
                <span className="opacity-80">PAS</span>
              </div>
            </div>
            <div className="flex flex-col border-l border-black/10">
              <div className="flex items-center justify-center gap-1">
                 <span className="font-bold">{Math.min(99, base.dri + (stats?.assistencias || 0) * 2)}</span>
                 <span className="opacity-80">DRI</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <span className="font-bold">{jogador.posicao === 'zagueiro' ? 85 : (jogador.posicao === 'volante' ? 75 : 40)}</span>
                <span className="opacity-80">DEF</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                 <span className="font-bold">{jogador.posicao === 'zagueiro' ? 82 : 70}</span>
                 <span className="opacity-80">PHY</span>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Bottom Decoration */}
      <div className="mt-auto">
        <Shield className={cn("opacity-50", currentSize.icon, textColors[variant])} />
      </div>
    </div>
  );
}
