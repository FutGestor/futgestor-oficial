import React from "react";
import { Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AchievementsTabProps {
  performance: any;
  statsSummary: any;
  navigate: (path: string) => void;
  basePath: string;
}

export const AchievementsTab: React.FC<AchievementsTabProps> = ({
  performance,
  statsSummary,
  navigate,
  basePath
}) => {
  return (
    <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" /> Suas Conquistas
            </CardTitle>
            <CardDescription className="text-muted-foreground">Veja seu progresso e evolução no time.</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-primary/20 text-primary hover:bg-primary/10 h-8 text-[10px] font-black uppercase italic"
            onClick={() => navigate(`${basePath}/conquistas`)}
          >
            Arena Completa
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-black/20 rounded-2xl p-6 border border-white/5">
          <div className="flex flex-col items-center text-center space-y-6">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total</p>
                   <p className="text-2xl font-black text-white italic">{performance?.playerStats?.length || 0}</p>
                   <p className="text-[9px] text-muted-foreground mt-1">Jogos</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Gols</p>
                   <p className="text-2xl font-black text-white italic">{statsSummary.gols}</p>
                   <p className="text-[9px] text-muted-foreground mt-1">Carreira</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Média</p>
                   <p className="text-2xl font-black text-white italic">{(statsSummary.gols / (statsSummary.jogos || 1)).toFixed(1)}</p>
                   <p className="text-[9px] text-muted-foreground mt-1">Gols / Jogo</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">MVP</p>
                   <p className="text-2xl font-black text-white italic">{statsSummary.mvp}</p>
                   <p className="text-[9px] text-muted-foreground mt-1">Destaque</p>
                </div>
             </div>

             <div className="w-full space-y-4">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-zinc-400">
                   <span>Evolução de Conquistas</span>
                   <span className="text-primary italic">Acesse a Arena</span>
                </div>
                <div className="h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-xl border border-primary/20 flex items-center justify-center cursor-pointer hover:from-primary/20 transition-all group"
                     onClick={() => navigate(`${basePath}/conquistas`)}>
                   <p className="text-xs font-black text-primary uppercase italic tracking-tighter group-hover:scale-110 transition-transform">
                      Visualizar Mural de Medalhas →
                   </p>
                </div>
             </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
