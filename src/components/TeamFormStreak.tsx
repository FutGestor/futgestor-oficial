import React from "react";
import { cn } from "@/lib/utils";

interface Result {
  gols_favor: number;
  gols_contra: number;
}

interface TeamFormStreakProps {
  resultados: Result[];
  maxResults?: number;
  size?: "sm" | "md";
}

export function TeamFormStreak({
  resultados,
  maxResults = 5,
  size = "md",
}: TeamFormStreakProps) {
  // Pegar apenas os resultados mais recentes e inverter para mostrar cronologicamente (da esquerda para direita)
  const recentResults = resultados.slice(0, maxResults).reverse();

  const getResultInfo = (res: Result) => {
    if (res.gols_favor > res.gols_contra) {
      return { label: "V", color: "bg-green-500" };
    }
    if (res.gols_favor < res.gols_contra) {
      return { label: "D", color: "bg-red-500" };
    }
    return { label: "E", color: "bg-amber-500" };
  };

  const sizeClass = size === "sm" ? "w-5 h-5 text-[10px]" : "w-7 h-7 text-xs";

  return (
    <div className="flex items-center gap-1.5">
      {recentResults.map((res, idx) => {
        const { label, color } = getResultInfo(res);
        return (
          <div
            key={idx}
            className={cn(
              "flex items-center justify-center rounded-full font-black text-white shadow-lg shrink-0 transition-transform hover:scale-110",
              color,
              sizeClass
            )}
            title={label === "V" ? "Vitória" : label === "D" ? "Derrota" : "Empate"}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
}
