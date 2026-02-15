import logoFutgestor from "@/assets/logo-futgestor.png";
import { cn } from "@/lib/utils";
import { ESCUDO_PADRAO } from "@/lib/constants";

interface FutGestorLogoProps {
  className?: string;
  showText?: boolean;
  textClassName?: string;
  teamEscudo?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}

export function FutGestorLogo({ 
  className, 
  showText = false, 
  textClassName, 
  teamEscudo,
  size = "md"
}: FutGestorLogoProps) {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-20 w-20",
    xl: "h-32 w-32"
  };

  const currentSize = sizes[size];

  return (
    <div className="inline-flex items-center gap-3 drop-shadow-2xl">
      {teamEscudo !== undefined ? (
        <img 
          src={teamEscudo || ESCUDO_PADRAO} 
          alt="Escudo do Time" 
          className={cn(currentSize, "object-contain animate-in fade-in zoom-in duration-700")} 
        />
      ) : (
        <img 
          src={logoFutgestor} 
          alt="FutGestor" 
          className={cn(className || currentSize, "object-contain transition-transform hover:scale-110 drop-shadow-[0_0_10px_rgba(230,179,37,0.3)]")}
        />
      )}
      
      {showText && (
        <span className={cn(
          "font-black uppercase italic tracking-tighter flex items-center select-none",
          size === "sm" && "text-xl",
          size === "md" && "text-3xl",
          size === "lg" && "text-5xl md:text-6xl",
          size === "xl" && "text-6xl md:text-8xl",
          textClassName
        )}>
          <span className="text-white drop-shadow-[0_4px_12px_rgba(255,255,255,0.3)]">Fut</span>
          <span className="text-primary drop-shadow-[0_4px_12px_rgba(230,179,37,0.3)]">Gestor</span>
        </span>
      )}
    </div>
  );
}
