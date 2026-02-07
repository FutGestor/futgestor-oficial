import { cn } from "@/lib/utils";
import { formationPositions, positionSlotLabels, type GameModality, type Jogador } from "@/lib/types";

interface SocietyFieldProps {
  modalidade: GameModality;
  formacao: string;
  jogadores: Array<{ jogador: Jogador; posicao_campo: string }>;
  className?: string;
}

export function SocietyField({ modalidade, formacao, jogadores, className }: SocietyFieldProps) {
  // Usa a formação para pegar posições dinâmicas
  const positions = formationPositions[formacao] || {};
  
  // Map jogadores to their positions
  const jogadorPorPosicao = jogadores.reduce((acc, { jogador, posicao_campo }) => {
    acc[posicao_campo] = jogador;
    return acc;
  }, {} as Record<string, Jogador>);

  const isSociety = modalidade !== 'campo-11';
  
  return (
    <div 
      className={cn(
        "relative mx-auto w-full max-w-md rounded-lg bg-green-600 p-4 shadow-inner",
        isSociety ? "aspect-[3/4]" : "aspect-[2/3]",
        className
      )}
    >
      {/* Campo base */}
      <div className="absolute inset-2 rounded-lg border-2 border-white/50">
        {/* Linha do meio */}
        <div className="absolute left-0 right-0 top-1/2 border-t-2 border-white/50" />
        
        {/* Círculo central */}
        <div className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/50",
          isSociety ? "h-12 w-12" : "h-16 w-16"
        )} />
        
        {/* Área superior (gol adversário) */}
        <div className={cn(
          "absolute left-1/4 right-1/4 top-0 border-2 border-t-0 border-white/50",
          isSociety ? "h-12" : "h-16"
        )} />
        
        {/* Pequena área superior */}
        <div className={cn(
          "absolute left-1/3 right-1/3 top-0 border-2 border-t-0 border-white/50",
          isSociety ? "h-6" : "h-8"
        )} />
        
        {/* Área inferior (nosso gol) */}
        <div className={cn(
          "absolute bottom-0 left-1/4 right-1/4 border-2 border-b-0 border-white/50",
          isSociety ? "h-12" : "h-16"
        )} />
        
        {/* Pequena área inferior */}
        <div className={cn(
          "absolute bottom-0 left-1/3 right-1/3 border-2 border-b-0 border-white/50",
          isSociety ? "h-6" : "h-8"
        )} />
      </div>

      {/* Posições no campo */}
      {Object.entries(positions).map(([posicao, coords]) => {
        const jogador = jogadorPorPosicao[posicao];
        const label = positionSlotLabels[posicao] || posicao.toUpperCase();
        
        return (
          <div
            key={posicao}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{ top: coords.top, left: coords.left }}
          >
          {jogador ? (
              <>
                {jogador.foto_url ? (
                  <img
                    src={jogador.foto_url}
                    alt={jogador.nome}
                    className="h-10 w-10 rounded-full object-cover shadow-lg border-2 border-primary-foreground"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-lg">
                    {jogador.numero || "?"}
                  </div>
                )}
                <span className="mt-1 rounded bg-black/50 px-1 text-xs font-medium text-white">
                  {jogador.apelido || jogador.nome.split(" ")[0]}
                </span>
              </>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-white/50 bg-white/20 text-xs font-medium text-white">
                {label}
              </div>
            )}
          </div>
        );
      })}

      {jogadores.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="rounded bg-black/50 px-4 py-2 text-white">
            Escalação não definida
          </p>
        </div>
      )}
    </div>
  );
}
