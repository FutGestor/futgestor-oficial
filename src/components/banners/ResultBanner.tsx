import { Resultado, Jogo, Time as TimeType } from "@/lib/types";
import { TeamSlugData } from "@/hooks/useTeamSlug";
import { format as formatDate } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FutGestorLogo } from "@/components/FutGestorLogo";
import { ESCUDO_PADRAO } from "@/lib/constants";
import { BannerShield } from "@/components/banners/BannerShield";

interface ResultBannerProps {
  team: TeamSlugData;
  resultado: (Resultado & { jogo: Jogo & { time_adversario?: TimeType | null } }) | null | undefined;
  format: 'story' | 'feed';
}

export function ResultBanner({ team, resultado, format }: ResultBannerProps) {
  const isStory = format === 'story';
  
  const golsFavor = resultado?.gols_favor ?? 0;
  const golsContra = resultado?.gols_contra ?? 0;
  
  let status = "EMPATE";
  let bgColor = "radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 100%)";
  let statusColor = "text-slate-400";
  let glowColor = "rgba(148, 163, 184, 0.3)";
  
  if (golsFavor > golsContra) {
    status = "VITÓRIA";
    bgColor = "radial-gradient(circle at center, #064e3b 0%, #022c22 100%)";
    statusColor = "text-emerald-400";
    glowColor = "rgba(52, 211, 153, 0.4)";
  } else if (golsFavor < golsContra) {
    status = "DERROTA";
    bgColor = "radial-gradient(circle at center, #450a0a 0%, #1a0505 100%)";
    statusColor = "text-red-400";
    glowColor = "rgba(248, 113, 113, 0.4)";
  }

  const dataExtenso = resultado?.jogo?.data_hora 
    ? formatDate(new Date(resultado.jogo.data_hora), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }).toUpperCase()
    : "";

  return (
    <div 
      className="relative flex flex-col items-center justify-between text-white overflow-hidden font-sans select-none"
      style={{
        width: '1080px',
        height: isStory ? '1920px' : '1080px',
        background: bgColor,
      }}
    >
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:60px_60px]"></div>
      </div>
      
      {/* Header */}
      <div className={isStory ? "mt-40 w-full text-center" : "mt-24 w-full text-center"}>
        <div className={`text-4xl font-black italic uppercase tracking-[0.4em] mb-2 ${statusColor} drop-shadow-[0_0_20px_${glowColor}]`}>
          {status}
        </div>
        <h2 className="text-7xl font-black italic uppercase tracking-tighter text-white drop-shadow-lg">
          Fim de Jogo
        </h2>
      </div>

      {/* Score section */}
      <div className="flex flex-col items-center gap-12 w-full px-20">
        <div className="flex items-center justify-center gap-10 w-full">
          <div className="flex flex-col items-center gap-6 flex-1">
            <BannerShield 
              escudoUrl={team.escudo_url} 
              teamName={team.nome} 
              size="2xl" 
              className="scale-[2] mb-12"
            />
          </div>

          <div className="flex items-center gap-8 bg-black/40 backdrop-blur-xl px-12 py-8 rounded-[40px] border border-white/10 shadow-2xl skew-x-[-5deg]">
            <span className="text-[180px] font-black leading-none drop-shadow-[0_0_40px_rgba(255,255,255,0.2)] skew-x-[5deg]">{golsFavor}</span>
            <span className="text-6xl font-black italic opacity-30 tracking-tight skew-x-[5deg] mx-4">X</span>
            <span className="text-[180px] font-black leading-none drop-shadow-[0_0_40px_rgba(255,255,255,0.2)] skew-x-[5deg]">{golsContra}</span>
          </div>

          <div className="flex flex-col items-center gap-6 flex-1">
            <BannerShield 
              escudoUrl={resultado?.jogo?.time_adversario?.escudo_url || (resultado?.jogo?.time_adversario as any)?.adversary_team?.escudo_url || null} 
              teamName={resultado?.jogo?.time_adversario?.nome || "Adversário"} 
              size="2xl" 
              className="scale-[2] mb-12"
            />
          </div>
        </div>
      </div>

      {/* Info section */}
      <div className={isStory ? "mb-40 flex flex-col items-center gap-6 w-full" : "mb-32 flex flex-col items-center gap-6 w-full"}>
        <p className="text-3xl font-bold text-white/80 uppercase tracking-widest italic tracking-wider">
           {team.nome} <span className="mx-4 text-white/30">VS</span> {resultado?.jogo?.time_adversario?.nome || "ADVERSÁRIO"}
        </p>
        <div className="h-px w-32 bg-white/20"></div>
        <p className="text-2xl font-medium text-white/50">{dataExtenso}</p>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-10 flex items-center gap-3 opacity-30">
        <FutGestorLogo className="h-10 w-10" />
        <span className="text-2xl font-black italic uppercase">FutGestor</span>
      </div>
    </div>
  );
}
