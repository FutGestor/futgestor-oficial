import { Jogador } from "@/lib/types";
import { TeamSlugData } from "@/hooks/useTeamSlug";
import { FutGestorLogo } from "@/components/FutGestorLogo";
import { ESCUDO_PADRAO } from "@/lib/constants";
import { BannerShield } from "@/components/banners/BannerShield";

interface TopScorerBannerProps {
  team: TeamSlugData;
  jogador: {
    id: string;
    nome: string;
    apelido: string | null;
    foto_url: string | null;
  } | undefined;
  gols: number | undefined;
  format: 'story' | 'feed';
}

export function TopScorerBanner({ team, jogador, gols, format }: TopScorerBannerProps) {
  const isStory = format === 'story';
  
  return (
    <div 
      className="relative flex flex-col items-center justify-between text-white overflow-hidden font-sans select-none"
      style={{
        width: '1080px',
        height: isStory ? '1920px' : '1080px',
        background: 'radial-gradient(circle at center, #1e1b4b 0%, #0f172a 100%)',
      }}
    >
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large transparent logo in bg */}
        <div className="absolute -right-40 -bottom-40 opacity-[0.03]">
            <FutGestorLogo className="h-[800px] w-[800px]" />
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_#0560B3_1px,_transparent_1px)] bg-[length:60px_60px] opacity-[0.05]"></div>
      </div>
      
      {/* Header */}
      <div className={isStory ? "mt-40 w-full text-center px-10" : "mt-24 w-full text-center px-10"}>
        <div className="text-3xl font-black italic uppercase tracking-[0.4em] text-white/30 mb-2">Destaque da Temporada</div>
        <h2 className="text-8xl font-black italic uppercase tracking-tighter text-white leading-tight drop-shadow-2xl">
           Artilheiro <br/>
           <span className="text-primary drop-shadow-[0_0_30px_rgba(5,96,179,0.5)]">do Time</span>
        </h2>
      </div>

      {/* Player section */}
      <div className="flex flex-col items-center justify-center flex-1 w-full px-20">
        <div className="relative mb-10 translate-y-[-20px]">
          {/* Outer glow ring */}
          <div className="absolute inset-[-40px] rounded-full bg-primary/20 blur-[80px] animate-pulse"></div>
          
          <div 
            className="relative h-[550px] w-[550px] overflow-hidden border-4 border-primary/50 shadow-[0_0_60px_rgba(5,96,179,0.4)] bg-slate-900"
            style={{
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
            }}
          >
             <img 
               src={jogador?.foto_url || ESCUDO_PADRAO} 
               alt={jogador?.nome || "Jogador"} 
               className="h-full w-full object-cover transition-all duration-500"
             />
             
             {/* Text overlay on image border */}
             <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black via-black/80 to-transparent flex items-end justify-center pb-10">
                <span className="text-6xl font-black italic uppercase tracking-tight text-white drop-shadow-lg">{jogador?.apelido || jogador?.nome || "MATADOR"}</span>
             </div>
          </div>

          {/* Goals Badge */}
          <div className="absolute -right-12 top-1/2 -translate-y-1/2 h-56 w-56 bg-primary rounded-full border-8 border-slate-950 flex flex-col items-center justify-center shadow-2xl skew-x-[-12deg] z-20">
             <span className="text-8xl font-black leading-none text-white drop-shadow-lg">{gols || 0}</span>
             <span className="text-3xl font-black uppercase italic tracking-tighter text-white/80">GOLS</span>
          </div>
        </div>
      </div>

      {/* Footer / Team Info */}
      <div className={isStory ? "mb-40 w-full flex flex-col items-center gap-8" : "mb-24 w-full flex flex-col items-center gap-8"}>
         <div className="flex items-center gap-8 bg-black/40 backdrop-blur-xl px-10 py-6 rounded-2xl border border-white/10 shadow-2xl">
            <BannerShield 
                escudoUrl={team.escudo_url} 
                teamName={team.nome} 
                size="xl" 
            />
            <div className="h-16 w-px bg-white/10"></div>
            <span className="text-5xl font-black italic uppercase text-white drop-shadow-lg">{team.nome}</span>
         </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-10 flex items-center gap-3 opacity-30">
        <FutGestorLogo className="h-10 w-10" />
        <span className="text-2xl font-black italic uppercase">FutGestor</span>
      </div>
    </div>
  );
}
