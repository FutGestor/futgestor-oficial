import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { formationPositions, positionSlotLabels, type GameModality, type Jogador } from "@/lib/types";

interface SocietyFieldProps {
  modalidade: GameModality;
  formacao: string;
  jogadores: Array<{ jogador: Jogador; posicao_campo: string }>;
  className?: string;
  onPlayerMove?: (jogadorId: string, newPosicao: string) => void;
  onPlayerClick?: (jogador: Jogador) => void;
  onPositionClick?: (posicao: string) => void;
  onPlayerRemove?: (jogadorId: string) => void;
  isEditable?: boolean;
}

export function SocietyField({
  modalidade,
  formacao,
  jogadores,
  className,
  onPlayerMove,
  onPlayerClick,
  onPositionClick,
  onPlayerRemove,
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
    <div className={cn("relative w-full mx-auto py-2 sm:py-4 md:py-6 px-2 sm:px-4", className)}>
      <div
        ref={fieldRef}
        className={cn(
          "relative mx-auto w-full max-w-[320px] sm:max-w-[400px] md:max-w-[480px] lg:max-w-[520px] rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] select-none transition-all duration-700 ease-out",
          "bg-black/20 backdrop-blur-md", // Fundo transparente com blur sutil
          "border border-white/10",
          isSociety ? "aspect-[3/4]" : "aspect-[2/3]"
        )}
      >
        {/* Gramado com padrão de listras (Mowing Patterns) */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_40px,rgba(255,255,255,0.03)_40px,rgba(255,255,255,0.03)_80px)]" />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_40px,rgba(255,255,255,0.02)_40px,rgba(255,255,255,0.02)_80px)]" />
        </div>

        {/* Brilho Superior (Refletores de Estádio) */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-blue-500/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[140%] h-40 bg-white/5 blur-[100px] rounded-full pointer-events-none" />

        {/* Linhas do Campo Estilo EA FC (Ciano/Branco sutis) */}
        <div className="absolute inset-4 rounded-xl border border-white/15 shadow-[0_0_20px_rgba(34,211,238,0.05)] pointer-events-none">
          {/* Linha do meio */}
          <div className="absolute left-0 right-0 top-1/2 border-t border-white/15" />
          
          {/* Círculo central */}
          <div className={cn(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15",
            isSociety ? "h-20 w-20" : "h-28 w-28"
          )} />
          
          {/* Ponto central brilhante */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-1.5 w-1.5 bg-cyan-400/40 rounded-full blur-[1px]" />

          {/* Áreas com preenchimento sutil */}
          <div className="absolute left-[15%] right-[15%] top-0 h-20 border border-t-0 border-white/15 bg-white/[0.01]" />
          <div className="absolute bottom-0 left-[15%] right-[15%] h-20 border border-b-0 border-white/15 bg-white/[0.01]" />
          
          {/* Pequena área */}
          <div className="absolute left-1/3 right-1/3 top-0 h-8 border border-t-0 border-white/10" />
          <div className="absolute bottom-0 left-1/3 right-1/3 h-8 border border-b-0 border-white/10" />
        </div>

        {/* Posições vazias clicáveis (modo editável) ou targets (modo visualização) */}
        {/* Só mostra posições padrão se NÃO houver jogadores em posições personalizadas */}
        {!draggingPlayer && Object.entries(basePositions).map(([posicao, coords]) => {
          const label = positionSlotLabels[posicao] || posicao.toUpperCase();
          const isOccupied = jogadores.some(j => j.posicao_campo === posicao);
          
          // Verificar se há jogadores em posições personalizadas (formato: LABEL|top|left)
          const hasCustomPositions = jogadores.some(j => j.posicao_campo.includes('|'));
          
          // Se houver posições personalizadas e não for modo editável, não mostra as posições padrão
          if (hasCustomPositions && !isEditable) return null;
          
          // Se houver posições personalizadas em modo editável, mostra apenas as posições não ocupadas
          if (hasCustomPositions && isOccupied) return null;
          
          // Se estiver ocupada e não for modo de arrastar, não mostra o target
          if (isOccupied && !isEditable) return null;
          
          // Se estiver ocupada em modo editável, ainda mostra um indicador sutil por baixo
          if (isOccupied) {
            return (
              <div
                key={`target-${posicao}`}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/5 bg-white/[0.02] w-[clamp(36px,12vw,56px)] h-[clamp(36px,12vw,56px)] transition-all pointer-events-none opacity-30"
                style={{ top: coords.top, left: coords.left }}
              >
                <span className="text-[8px] font-black text-white/30 tracking-tighter">{label}</span>
              </div>
            );
          }
          
          // Posição vazia - clicável em modo editável
          return (
            <button
              key={posicao}
              type="button"
              onClick={() => onPositionClick?.(posicao)}
              className={cn(
                "absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-dashed border-white/30 bg-white/[0.05] w-[clamp(36px,12vw,56px)] h-[clamp(36px,12vw,56px)] transition-all",
                isEditable 
                  ? "cursor-pointer hover:bg-white/10 hover:border-white/50 hover:scale-110 active:scale-95" 
                  : "pointer-events-none opacity-50"
              )}
              style={{ top: coords.top, left: coords.left }}
              disabled={!isEditable}
            >
              <span className="text-[clamp(8px,2.5vw,12px)] font-black text-white/40 tracking-tighter">{label}</span>
            </button>
          );
        })};

        {/* Jogadores Escalados (Estilo Tactical Card) */}
        {jogadores.map(({ jogador, posicao_campo }) => {
          if (!jogador) return null;
          const { top, left, label } = getPlayerCoords(posicao_campo);
          const isDragging = draggingPlayer === jogador.id;
          
          const getPosColor = (pos: string) => {
            const p = pos.toLowerCase();
            if (p === 'gol' || p === 'goleiro') return 'from-yellow-500/80 to-yellow-600/50 text-yellow-500';
            if (['zagueiro', 'lateral', 'zag', 'lte', 'ltd'].some(s => p.includes(s))) return 'from-blue-500/80 to-blue-600/50 text-blue-400';
            if (['volante', 'meia', 'vol', 'mei', 'me', 'md'].some(s => p.includes(s))) return 'from-emerald-500/80 to-emerald-600/50 text-emerald-400';
            return 'from-rose-500/80 to-rose-600/50 text-rose-400'; // ATA
          };

          const posTheme = getPosColor(label || jogador.posicao);

          return (
            <div
              key={jogador.id}
              onMouseDown={(e) => handleMouseDown(e, jogador.id)}
              onTouchStart={(e) => handleMouseDown(e, jogador.id)}
              onClick={() => onPlayerClick?.(jogador)}
              className={cn(
                "absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center cursor-pointer transition-all duration-300 touch-none",
                isDragging && "z-50 scale-110",
                !isDragging && "z-10",
                onPlayerClick && "hover:scale-110"
              )}
              style={{ 
                top, 
                left
              }}
            >
              {/* Tactical Circle Avatar - Tamanho proporcional ao campo */}
              <div className="relative group">
                <div className={cn(
                  "relative w-[clamp(36px,12vw,56px)] h-[clamp(36px,12vw,56px)] rounded-full p-0.5 bg-gradient-to-tr shadow-2xl transition-all border border-white/20",
                  posTheme.split(' ').slice(0, 2).join(' ')
                )}>
                  {jogador.foto_url ? (
                    <img
                      src={jogador.foto_url}
                      alt={jogador.nome}
                      className="h-full w-full rounded-full object-cover pointer-events-none brightness-110 contrast-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-900 text-[clamp(10px,3vw,14px)] font-black text-white pointer-events-none">
                      {jogador.numero || "?"}
                    </div>
                  )}
                  
                  {/* Rating Badge - Proporcional */}
                  <div className="absolute -top-0.5 -left-0.5 w-[clamp(16px,5vw,26px)] h-[clamp(16px,5vw,26px)] rounded-full bg-slate-950 border border-white/30 flex items-center justify-center shadow-lg">
                    <span className="text-[clamp(8px,2.5vw,12px)] font-black text-white italic">
                      {jogador.numero || '99'}
                    </span>
                  </div>

                  {/* SETOR Badge - Proporcional */}
                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 px-[clamp(2px,1vw,6px)] rounded-sm bg-slate-950 border border-white/20 flex items-center justify-center shadow-md min-w-[clamp(16px,4vw,24px)]",
                    posTheme.split(' ').slice(2).join(' ')
                  )}>
                    <span className="text-[clamp(6px,2vw,10px)] font-black uppercase italic tracking-tighter">
                      {label}
                    </span>
                  </div>
                </div>
                
                {/* Glow de seleção */}
                {isDragging && (
                  <div className="absolute inset-0 rounded-full bg-white/20 animate-ping pointer-events-none" />
                )}
              </div>

              {/* Nome - Desktop: sempre visível, Mobile: apenas no hover */}
              <div className="mt-1 sm:mt-2 relative hidden sm:block">
                {!isDragging && (
                  <div className="absolute inset-0 translate-y-1 blur-sm bg-black/40 rounded-full" />
                )}
                <div className="relative rounded-full bg-gradient-to-b from-slate-900 to-black/90 backdrop-blur-md border border-white/15 px-1 sm:px-2 py-0.5 shadow-2xl max-w-[clamp(60px,15vw,100px)]">
                  <span className="text-[clamp(7px,2vw,10px)] font-bold text-white uppercase tracking-tight truncate block text-center">
                    {jogador.apelido || jogador.nome.split(" ")[0]}
                  </span>
                </div>
              </div>
              
              {/* Tooltip/Nome no hover para mobile */}
              <div className="mt-1 sm:mt-2 relative sm:hidden opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="relative rounded-full bg-gradient-to-b from-slate-900 to-black/90 backdrop-blur-md border border-white/15 px-1 sm:px-2 py-0.5 shadow-2xl">
                  <span className="text-[clamp(7px,2vw,10px)] font-bold text-white uppercase tracking-tight whitespace-nowrap">
                    {jogador.apelido || jogador.nome.split(" ")[0]}
                  </span>
                </div>
              </div>

              {/* Botão X para remover jogador (apenas em modo editável) */}
              {isEditable && onPlayerRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayerRemove(jogador.id);
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-bold flex items-center justify-center shadow-lg border border-white/20 z-50 transition-colors"
                  title="Remover jogador"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}

        {jogadores.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-4 animate-pulse">
               <div className="h-20 w-20 border-2 border-dashed border-white/10 rounded-full flex items-center justify-center">
                  <div className="h-10 w-10 border border-white/5 rounded-full" />
               </div>
               <p className="text-[10px] uppercase font-black text-white/30 tracking-[0.3em]">
                 Aguardando Tática
               </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
