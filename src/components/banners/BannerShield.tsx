import { ESCUDO_PADRAO } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";

interface BannerShieldProps {
  escudoUrl: string | null;
  teamName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const sizeMap = {
  xs: "h-6 w-6",
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
  "2xl": "h-32 w-32"
};

export function BannerShield({ escudoUrl, teamName, size = 'md', className }: BannerShieldProps) {
  const currentSize = sizeMap[size];

  return (
    <div className={cn(
      "relative flex items-center justify-center shrink-0",
      currentSize,
      className
    )}>
      {/* Gem Frame - Hexagonal base with glow */}
      <div 
        className="absolute inset-0 bg-primary/20 backdrop-blur-sm border-2 border-primary/40 shadow-[0_0_20px_rgba(5,96,179,0.5)]"
        style={{
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
        }}
      />
      
      {/* Inner Masked Image */}
      <div 
        className="relative z-10 w-[92%] h-[92%] bg-black/80 flex items-center justify-center"
        style={{
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
        }}
      >
        {escudoUrl ? (
          <img
            src={escudoUrl}
            alt={`Escudo do ${teamName}`}
            className="w-[85%] h-[85%] object-contain scale-110"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full p-2 opacity-40">
            <Shield className="w-full h-full text-white" />
          </div>
        )}
      </div>

      {/* Shine effect overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30 bg-gradient-to-tr from-transparent via-white/20 to-transparent"
        style={{
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
        }}
      />
    </div>
  );
}
