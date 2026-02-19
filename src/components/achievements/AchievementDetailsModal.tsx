import React from "react";
import { AchievementBadge, AchievementTier } from "./AchievementBadge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";

interface Tier {
  level: AchievementTier;
  label: string;
  threshold: number;
}

interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tiers: Tier[];
}

interface PlayerAchievement {
  achievement_id: string;
  current_tier: AchievementTier;
  current_value: number;
  unlocked_at?: string;
  achievement: Achievement;
}

interface AchievementDetailsModalProps {
  playerAchievement: PlayerAchievement | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AchievementDetailsModal: React.FC<AchievementDetailsModalProps> = ({
  playerAchievement,
  isOpen,
  onOpenChange,
}) => {
  if (!playerAchievement) return null;

  const { achievement, current_tier, current_value } = playerAchievement;
  const tiers = achievement.tiers || [];
  
  const currentTierIndex = tiers.findIndex(t => t.level === current_tier);
  const nextTierIndex = currentTierIndex + 1;
  const nextTier = tiers[nextTierIndex];
  
  // Se não tem tier atual, o alvo para desbloquear é o primeiro tier
  const targetTier = nextTier || (current_tier ? null : tiers[0]);
  
  const isMaxLevel = current_tier && !nextTier;
  const progressPercent = targetTier 
    ? Math.min((current_value / targetTier.threshold) * 100, 100)
    : 100;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-md overflow-hidden" onCloseAutoFocus={(e) => e.preventDefault()}>
        {/* Background Glow based on current tier */}
        <div className={cn(
          "absolute -top-24 -left-24 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none",
          current_tier === 'bronze' && "bg-amber-600",
          current_tier === 'prata' && "bg-slate-400",
          current_tier === 'ouro' && "bg-yellow-400",
          current_tier === 'diamante' && "bg-purple-500",
          current_tier === 'unica' && "bg-emerald-500",
          !current_tier && "bg-zinc-600"
        )} />

        <DialogHeader className="flex flex-col items-center relative z-10 pt-4">
          <AchievementBadge 
            slug={achievement.slug}
            tier={current_tier}
            iconName={achievement.icon}
            size="lg"
            locked={!current_tier}
            className="mb-4"
          />
          <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-center text-white">
            {achievement.name}
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-center max-w-[280px]">
            {achievement.description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-8 space-y-8 relative z-10">
          {/* Progress Section */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
            <div className="flex justify-between items-end">
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500">
                  {isMaxLevel ? "Status Atual" : "Próximo Desbloqueio"}
                </p>
                <p className="text-sm font-bold text-white">
                  {isMaxLevel ? "Nível Máximo Alcançado" : targetTier?.label}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black italic tracking-tighter text-primary">
                  {current_value} <span className="text-xs italic text-zinc-500 normal-case">/ {targetTier?.threshold || current_value}</span>
                </p>
              </div>
            </div>
            
            <Progress value={progressPercent} className="h-3 bg-zinc-900 border border-white/5" />
            
            {!current_tier && (
              <p className="text-[10px] text-center text-zinc-500 font-medium">
                Faltam <span className="text-zinc-300">{(targetTier?.threshold || 0) - current_value}</span> para desbloquear esta conquista
              </p>
            )}
          </div>

          {/* Tiers List */}
          <div className="space-y-3">
            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500 px-1">Níveis Disponíveis</p>
            <div className="grid grid-cols-2 gap-2">
               {tiers.map((tier, idx) => {
                 const isReached = idx <= currentTierIndex || (current_tier && !nextTier && idx < tiers.length);
                 const isNext = idx === nextTierIndex || (!current_tier && idx === 0);
                 
                 return (
                   <div 
                     key={tier.level}
                     className={cn(
                       "p-3 rounded-lg border flex flex-col items-center gap-1 transition-all duration-300",
                       isReached 
                         ? "bg-white/10 border-white/20 shadow-lg" 
                         : isNext 
                           ? "bg-white/[0.03] border-white/10" 
                           : "bg-black/20 border-white/5 opacity-40"
                     )}
                   >
                     <span className={cn(
                       "text-[9px] uppercase font-black tracking-[0.15em] mb-1",
                       tier.level === 'bronze' && "text-amber-500",
                       tier.level === 'prata' && "text-slate-400",
                       tier.level === 'ouro' && "text-yellow-500",
                       tier.level === 'diamante' && "text-purple-400",
                       tier.level === 'unica' && "text-emerald-400",
                       !isReached && "text-zinc-600"
                     )}>
                       {tier.level}
                     </span>
                     <span className="text-[11px] font-bold text-zinc-100 text-center leading-tight">
                       {tier.label}
                     </span>
                     <span className="text-[10px] text-zinc-500 font-bold tracking-tighter">
                       {tier.threshold} PTS
                     </span>
                   </div>
                 )
               })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
