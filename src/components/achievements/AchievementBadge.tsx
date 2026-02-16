import React from "react";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

export type AchievementTier = "bronze" | "prata" | "ouro" | "diamante" | "unica" | null;

interface AchievementBadgeProps {
  slug: string;
  tier: AchievementTier;
  iconName?: string; // Mantido por compatibilidade
  size?: "xs" | "sm" | "md" | "lg";
  locked?: boolean;
  className?: string;
  onClick?: () => void;
  showName?: boolean;
  name?: string;
}

const tierConfig = {
  locked: {
    stars: 0,
    label: "",
    starColor: "",
    bannerColor: "",
    imageFilter: "grayscale(100%) opacity(0.3)",
    glow: "drop-shadow(0 0 0 transparent)",
  },
  bronze: {
    stars: 1,
    label: "BRONZE",
    starColor: "text-amber-600",
    bannerColor: "bg-gradient-to-r from-amber-800 to-amber-600 text-amber-100",
    imageFilter: "none",
    glow: "drop-shadow(0 0 6px rgba(205,127,50,0.4))",
  },
  prata: {
    stars: 2,
    label: "PRATA",
    starColor: "text-gray-300",
    bannerColor: "bg-gradient-to-r from-gray-500 to-gray-300 text-white",
    imageFilter: "none",
    glow: "drop-shadow(0 0 8px rgba(192,192,192,0.4))",
  },
  ouro: {
    stars: 3,
    label: "OURO",
    starColor: "text-yellow-400",
    bannerColor: "bg-gradient-to-r from-yellow-600 to-yellow-400 text-yellow-900",
    imageFilter: "none",
    glow: "drop-shadow(0 0 10px rgba(255,215,0,0.5))",
  },
  diamante: {
    stars: 4,
    label: "DIAMANTE",
    starColor: "text-purple-400",
    bannerColor: "bg-gradient-to-r from-purple-700 to-blue-500 text-white",
    imageFilter: "none",
    glow: "drop-shadow(0 0 12px rgba(139,92,246,0.6))",
  },
  unica: {
    stars: 0,
    label: "ESPECIAL",
    starColor: "text-emerald-400",
    bannerColor: "bg-gradient-to-r from-emerald-700 to-emerald-500 text-white",
    imageFilter: "none",
    glow: "drop-shadow(0 0 8px rgba(16,185,129,0.5))",
  },
};

const sizeClasses = {
  xs: "w-8 h-8",
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-40 h-40",
};

const imageSizes = {
  xs: "h-6 w-6",
  sm: "h-12 w-12",
  md: "h-16 w-16",
  lg: "h-20 w-20",
};

function TierStars({ tier, maxStars = 4 }: { tier: AchievementTier, maxStars?: number }) {
  const config = tierConfig[tier || "locked"];
  
  if (tier === "unica") {
    return <span className="text-emerald-400 text-[10px] mt-1 drop-shadow-[0_0_3px_rgba(52,211,153,0.5)]">✦ ESPECIAL ✦</span>;
  }
  
  if (config.stars === 0) return <div className="h-3 mt-1" />;
  
  return (
    <div className="flex gap-0.5 justify-center mt-1">
      {Array.from({ length: maxStars }).map((_, i) => (
        <Star 
          key={i}
          className={cn(
            "h-2 w-2",
            i < config.stars ? cn(config.starColor, "fill-current") : "text-white/10"
          )}
        />
      ))}
    </div>
  );
}

function TierBanner({ tier }: { tier: AchievementTier }) {
  const config = tierConfig[tier || "locked"];
  if (!config.label) return null;
  
  return (
    <div className={cn(
      "mt-1 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-[0.15em] shrink-0 border border-white/5",
      config.bannerColor
    )}>
      {config.label}
    </div>
  );
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  slug,
  tier,
  size = "md",
  locked = false,
  className,
  onClick,
  showName = false,
  name,
}) => {
  const isLocked = !tier || locked;
  const config = tierConfig[isLocked ? "locked" : tier];
  const imagePath = `/achievements/${slug}.png`;

  return (
    <div 
      className={cn(
        "relative flex flex-col items-center justify-center transition-all duration-300 shrink-0",
        onClick && "cursor-pointer hover:scale-110 active:scale-95 group",
        className
      )}
      onClick={onClick}
    >
      <div 
        className={cn(
          "relative flex items-center justify-center transition-all duration-300",
          sizeClasses[size],
          tier === 'diamante' && !isLocked && "animate-diamond-pulse"
        )}
        style={{ 
          filter: isLocked ? config.imageFilter : config.glow 
        }}
      >
        <img
          src={imagePath}
          alt={slug}
          className={cn(
            "object-contain transition-all duration-300",
            imageSizes[size],
            isLocked && "grayscale opacity-30"
          )}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/achievements/presenca.png";
          }}
        />
      </div>

      {!isLocked && size !== "xs" && (
        <div className="flex flex-col items-center w-full">
          <TierStars tier={tier} />
          <TierBanner tier={tier} />
        </div>
      )}

      {showName && name && (
        <p className="mt-2 text-[10px] font-bold text-white uppercase tracking-tighter text-center line-clamp-1 max-w-[80px]">
          {name}
        </p>
      )}
    </div>
  );
};
