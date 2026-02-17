import React from "react";

interface TeamApprovalDonutProps {
  vitorias: number;
  empates: number;
  derrotas: number;
  size?: number;
}

export function TeamApprovalDonut({
  vitorias,
  empates,
  derrotas,
  size = 120,
}: TeamApprovalDonutProps) {
  const totalJogos = vitorias + empates + derrotas;
  const pontosConquistados = vitorias * 3 + empates * 1;
  const pontosPossiveis = totalJogos * 3;
  const aproveitamento = totalJogos > 0 
    ? Math.round((pontosConquistados / pontosPossiveis) * 100) 
    : 0;

  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Cálculo das fatias (segmentos)
  const vitoriaPercent = totalJogos > 0 ? (vitorias / totalJogos) : 0;
  const empatePercent = totalJogos > 0 ? (empates / totalJogos) : 0;
  const derrotaPercent = totalJogos > 0 ? (derrotas / totalJogos) : 0;

  const vitoriaOffset = 0;
  const vitoriaStroke = circumference * vitoriaPercent;

  const empateOffset = vitoriaStroke;
  const empateStroke = circumference * empatePercent;

  const derrotaOffset = vitoriaStroke + empateStroke;
  const derrotaStroke = circumference * derrotaPercent;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={strokeWidth}
        />
        
        {/* Vitória Segment */}
        {vitoriaStroke > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="hsl(var(--primary))"
            strokeWidth={strokeWidth}
            strokeDasharray={`${vitoriaStroke} ${circumference}`}
            strokeDashoffset={-vitoriaOffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        )}

        {/* Empate Segment */}
        {empateStroke > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#f59e0b" // amber-500
            strokeWidth={strokeWidth}
            strokeDasharray={`${empateStroke} ${circumference}`}
            strokeDashoffset={-empateOffset}
            strokeLinecap={vitoriaStroke > 0 ? "butt" : "round"}
            className="transition-all duration-1000 ease-out"
          />
        )}

        {/* Derrota Segment */}
        {derrotaStroke > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#ef4444" // red-500
            strokeWidth={strokeWidth}
            strokeDasharray={`${derrotaStroke} ${circumference}`}
            strokeDashoffset={-derrotaOffset}
            strokeLinecap={empateStroke > 0 || vitoriaStroke > 0 ? "butt" : "round"}
            className="transition-all duration-1000 ease-out"
          />
        )}
      </svg>
      
      {/* Texto Central */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-black italic tracking-tighter text-white">
          {aproveitamento}%
        </span>
        <span className="text-[8px] uppercase font-black tracking-widest text-muted-foreground -mt-1">
          Aproveitamento
        </span>
      </div>
    </div>
  );
}
