import { Jogo } from "@/lib/types";
import { TeamSlugData } from "@/hooks/useTeamSlug";
import { format as formatDate } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FutGestorLogo } from "@/components/FutGestorLogo";
import { ESCUDO_PADRAO } from "@/lib/constants";
import { BannerShield } from "@/components/banners/BannerShield";

interface MatchDayBannerProps {
  team: TeamSlugData;
  jogo: Jogo | null | undefined;
  format: 'story' | 'feed';
}

export function MatchDayBanner({ team, jogo, format }: MatchDayBannerProps) {
  const isStory = format === 'story';
  
  const dataExtenso = jogo?.data_hora 
    ? formatDate(new Date(jogo.data_hora), "EEEE dd/MM '•' HH'H'mm", { locale: ptBR }).toUpperCase()
    : "PRÓXIMO JOGO EM BREVE";

  return (
    <div 
      className="relative flex flex-col items-center justify-between text-white overflow-hidden font-sans select-none"
      style={{
        width: '1080px',
        height: isStory ? '1920px' : '1080px',
        background: 'radial-gradient(circle at center, #1a1a2e 0%, #0a0a0a 100%)',
      }}
    >
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_#0560B3_1px,_transparent_1px)] bg-[length:60px_60px]"></div>
      </div>
      
      {/* Header */}
      <div className={isStory ? "mt-40 w-full text-center" : "mt-24 w-full text-center"}>
        <div className="text-3xl font-black italic uppercase tracking-[0.4em] text-white/30 mb-2">FutGestor Apresenta</div>
        <h2 className="text-7xl font-black italic uppercase tracking-tighter text-primary drop-shadow-[0_0_30px_rgba(5,96,179,0.5)]">
          Dia de Jogo
        </h2>
      </div>

      {/* Versus section */}
      <div className="flex flex-col items-center gap-12 w-full px-20">
        <div className="flex items-center justify-center gap-16 w-full">
          <div className="flex flex-col items-center gap-8 flex-1">
            <BannerShield 
              escudoUrl={team.escudo_url} 
              teamName={team.nome} 
              size="2xl" 
              className="scale-[2.2] mb-16"
            />
            <span className="text-4xl font-black uppercase text-center drop-shadow-lg tracking-tighter italic">{team.nome}</span>
          </div>

          <div className="text-9xl font-black italic text-white/10 skew-x-[-15deg] select-none translate-y-[-40px]">VS</div>

          <div className="flex flex-col items-center gap-8 flex-1">
            <BannerShield 
              escudoUrl={(jogo?.time_adversario as any)?.escudo_url} 
              teamName={(jogo?.time_adversario as any)?.nome || "Adversário"} 
              size="2xl" 
              className="scale-[2.2] mb-16"
            />
            <span className="text-4xl font-black uppercase text-center drop-shadow-lg tracking-tighter italic">
              {(jogo?.time_adversario as any)?.nome || "ADVERSÁRIO"}
            </span>
          </div>
        </div>
      </div>

      {/* Info section */}
      <div className={isStory ? "mb-40 flex flex-col items-center gap-6 w-full" : "mb-32 flex flex-col items-center gap-6 w-full"}>
        <div className="bg-primary/20 border border-primary/30 px-12 py-6 rounded-2xl backdrop-blur-md">
          <p className="text-4xl font-black tracking-tight">{dataExtenso}</p>
        </div>
        <p className="text-2xl font-bold text-slate-400 uppercase tracking-widest italic">
          📍 {jogo?.local || "A DEFINIR"}
        </p>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-10 flex items-center gap-3 opacity-50">
        <FutGestorLogo className="h-10 w-10" />
        <span className="text-2xl font-black italic uppercase">FutGestor</span>
      </div>
    </div>
  );
}
