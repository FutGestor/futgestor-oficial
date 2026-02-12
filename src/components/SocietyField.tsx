import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { formationPositions, positionSlotLabels, type GameModality, type Jogador } from "@/lib/types";

interface SocietyFieldProps {
  modalidade: GameModality;
  formacao: string;
  jogadores: Array<{ jogador: Jogador; posicao_campo: string }>;
  className?: string;
  onPlayerMove?: (jogadorId: string, newPosicao: string) => void;
  isEditable?: boolean;
}

export function SocietyField({
  modalidade,
  formacao,
  jogadores,
  className,
  onPlayerMove,
  isEditable = false
}: SocietyFieldProps) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const [draggingPlayer, setDraggingPlayer] = useState<string | null>(null);

  // Usa a formação para pegar posições dinâmicas
  const basePositions = formationPositions[formacao] || {};

  // Função para extrair coordenadas ou usar as bases da formação
  const getPlayerCoords = (posicao_campo: string) => {
    if (posicao_campo.includes('|')) {
      const [label, top, left] = posicao_campo.split('|');
      return { top: `${top}%`, left: `${left}%`, label };
    }

    // Fallback para as posições pré-definidas da formação
    const coords = basePositions[posicao_campo] || { top: '50%', left: '50%' };
    const label = positionSlotLabels[posicao_campo] || posicao_campo.toUpperCase();
    return { ...coords, label };
  };

  // Função para determinar o label da posição baseado nas coordenadas (%)
  const getSectorLabel = (top: number, left: number): string => {
    // Top vai de 0 (ataque) a 100 (defesa)

    // Goleiro (fundo do campo)
    if (top > 85 && left > 35 && left < 65) return "GOL";

    // Linha Defensiva
    if (top > 70) {
      if (left < 30) return "LTE";
      if (left > 70) return "LTD";
      return "ZAG";
    }

    // Volantes
    if (top > 55) {
      if (left < 35) return "ME"; // Meia lateral/recuado
      if (left > 65) return "MD";
      return "VOL";
    }

    // Meio de Campo
    if (top > 35) {
      if (left < 30) return "ME";
      if (left > 70) return "MD";
      return "MEI";
    }

    // Ataque/Pontas
    if (top > 15) {
      if (left < 30) return "PTE";
      if (left > 70) return "PTD";
      return "ATA";
    }

    return "ATA";
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent, jogadorId: string) => {
    if (!isEditable) return;
    e.preventDefault();
    setDraggingPlayer(jogadorId);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!draggingPlayer || !fieldRef.current || !onPlayerMove) return;

      const rect = fieldRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      // Calcular posição relativa em %
      let left = ((clientX - rect.left) / rect.width) * 100;
      let top = ((clientY - rect.top) / rect.height) * 100;

      // Restringir aos limites do campo
      left = Math.max(5, Math.min(95, left));
      top = Math.max(5, Math.min(95, top));

      const label = getSectorLabel(top, left);
      const encodedPos = `${label}|${top.toFixed(0)}|${left.toFixed(0)}`;

      onPlayerMove(draggingPlayer, encodedPos);
    };

    const handleUp = () => {
      setDraggingPlayer(null);
    };

    if (draggingPlayer) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchend', handleUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, [draggingPlayer, onPlayerMove]);

  const isSociety = modalidade !== 'campo-11';

  return (
    <div
      ref={fieldRef}
      className={cn(
        "relative mx-auto w-full max-w-md rounded-lg bg-green-600 p-4 shadow-inner overflow-hidden select-none",
        isSociety ? "aspect-[3/4]" : "aspect-[2/3]",
        className
      )}
    >
      {/* Campo base */}
      <div className="absolute inset-2 rounded-lg border-2 border-white/50 pointer-events-none">
        {/* Linha do meio */}
        <div className="absolute left-0 right-0 top-1/2 border-t-2 border-white/50" />
        {/* Círculo central */}
        <div className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/50",
          isSociety ? "h-12 w-12" : "h-16 w-16"
        )} />
        {/* Áreas */}
        <div className="absolute left-1/4 right-1/4 top-0 h-12 border-2 border-t-0 border-white/50" />
        <div className="absolute bottom-0 left-1/4 right-1/4 h-12 border-2 border-b-0 border-white/50" />
      </div>

      {/* Posições vazias da formação (apenas se o campo estiver vazio) */}
      {!draggingPlayer && jogadores.length === 0 && Object.entries(basePositions).map(([posicao, coords]) => {

        const label = positionSlotLabels[posicao] || posicao.toUpperCase();
        return (
          <div
            key={posicao}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-dashed border-white/50 bg-white/10 text-[10px] font-bold text-white/70 h-10 w-10 transition-all pointer-events-none"
            style={{ top: coords.top, left: coords.left }}
          >
            {label}
          </div>
        );
      })}

      {/* Jogadores escalados */}
      {jogadores.map(({ jogador, posicao_campo }) => {
        const { top, left, label } = getPlayerCoords(posicao_campo);
        const isDragging = draggingPlayer === jogador.id;

        return (
          <div
            key={jogador.id}
            onMouseDown={(e) => handleMouseDown(e, jogador.id)}
            onTouchStart={(e) => handleMouseDown(e, jogador.id)}
            className={cn(
              "absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center cursor-move transition-transform",
              isDragging && "scale-110 z-50",
              !isDragging && "z-10"
            )}
            style={{ top, left }}
          >
            {jogador.foto_url ? (
              <img
                src={jogador.foto_url}
                alt={jogador.nome}
                className="h-10 w-10 rounded-full object-cover shadow-lg border-2 border-primary-foreground pointer-events-none"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-lg border-2 border-white pointer-events-none">
                {jogador.numero || "?"}
              </div>
            )}
            <div className="mt-1 flex flex-col items-center">
              <span className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm leading-none">
                {label}
              </span>
              <span className="mt-0.5 rounded bg-white/90 px-1 text-[9px] font-medium text-black shadow-sm">
                {jogador.apelido || jogador.nome.split(" ")[0]}
              </span>
            </div>
          </div>
        );
      })}

      {jogadores.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="rounded bg-black/50 px-4 py-2 text-white">
            Escalação não definida
          </p>
        </div>
      )}
    </div>
  );
}
