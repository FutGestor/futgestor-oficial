import { Jogador } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";
import { AchievementBadge } from "../achievements/AchievementBadge";

interface StickerCardProps {
  jogador: Jogador | any; // Any for public player compatibility
  achievements?: any[];
  className?: string;
  variant?: "gold" | "silver" | "bronze";
  size?: "sm" | "md" | "lg";
}

export function StickerCard({ jogador, achievements, className, variant = "gold", size = "md" }: StickerCardProps) {
  const variants = {
    gold: "bg-gradient-to-br from-[#2A5A8C] via-[#1B3A5C] to-[#0F2440] border-[#3B82F6]/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]",
    silver: "bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 border-slate-400",
    bronze: "bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 border-amber-600",
  };

  const textColors = {
    gold: "text-white",
    silver: "text-black",
    bronze: "text-white",
  };

  const sizes = {
    sm: {
      container: "w-14 h-22 p-1 rounded-t-xl rounded-b-md border",
      rating: "text-[10px]",
      pos: "text-[6px]",
      img: "w-8 h-8",
      name: "text-[8px] mb-0.5",
      achievements: "px-1 gap-1",
      icon: "w-2 h-2"
    },
    md: {
      container: "w-40 h-60 p-2 rounded-t-2xl rounded-b-lg border-2",
      rating: "text-base",
      pos: "text-[10px]",
      img: "w-24 h-24",
      name: "text-sm",
      achievements: "px-2 gap-2",
      icon: "w-3 h-3"
    },
    lg: {
      container: "w-48 h-72 p-2 rounded-t-2xl rounded-b-lg border-2",
      rating: "text-lg",
      pos: "text-xs",
      img: "w-28 h-28",
      name: "text-lg",
      achievements: "px-3 gap-3",
      icon: "w-4 h-4"
    }
  };

  const currentSize = sizes[size];

  // Ordenar e pegar as Top 4 conquistas
  const tierOrder: Record<string, number> = { diamante: 4, ouro: 3, prata: 2, bronze: 1, unica: 5 };
  const topAchievements = (achievements || [])
    .filter(a => !!a.current_tier)
    .sort((a, b) => (tierOrder[b.current_tier!] || 0) - (tierOrder[a.current_tier!] || 0))
    .slice(0, 4);

  return (
    <div className={cn(
      "relative flex flex-col items-center select-none shadow-xl transition-transform",
      currentSize.container,
      variants[variant],
      className
    )}>
      {/* Top Info */}
      <div className={cn("self-start flex flex-col leading-none font-black italic", currentSize.rating, textColors[variant])}>
        <span className="tracking-tighter">
          {jogador.numero ? `#${jogador.numero}` : (topAchievements.length > 0 ? 80 + (topAchievements.length * 5) : 70)}
        </span>
        <span className={cn("uppercase opacity-70", currentSize.pos)}>{jogador.posicao?.substring(0, 3)}</span>
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
        <div className={cn("font-bold uppercase truncate leading-tight", currentSize.name, textColors[variant])}>
          {jogador.apelido || jogador.nome}
        </div>
        <div className="h-[1px] w-full bg-white/20 my-0.5 shadow-sm" />
      </div>

      <div className={cn("flex flex-wrap justify-center items-center w-full mt-2", currentSize.achievements)}>
        {topAchievements.length > 0 ? (
          topAchievements.map((item, idx) => (
            <AchievementBadge 
              key={idx}
              slug={item.achievement?.slug}
              tier={item.current_tier}
              iconName={item.achievement?.icon}
              size="xs"
            />
          ))
        ) : (
          <div className="text-[8px] opacity-40 uppercase font-bold italic">Sem Conquistas</div>
        )}
      </div>
      
      {/* Bottom Decoration */}
      <div className="mt-auto">
        <Shield className={cn("opacity-50", currentSize.icon, textColors[variant])} />
      </div>
    </div>
  );
}
