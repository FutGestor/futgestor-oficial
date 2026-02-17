import { ESCUDO_PADRAO } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";

interface TeamShieldProps {
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

export function TeamShield({ escudoUrl, teamName, size = 'md', className }: TeamShieldProps) {
  const currentSize = sizeMap[size];

  return (
    <div className={cn(
      "relative flex items-center justify-center shrink-0 overflow-hidden rounded-full border-2 border-white/10 bg-black/40 shadow-lg",
      currentSize,
      className
    )}>
      {escudoUrl ? (
        <img
          src={escudoUrl}
          alt={`Escudo do ${teamName}`}
          className="h-full w-full object-cover transition-transform hover:scale-110 duration-500"
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full p-1.5 opacity-40">
          <Shield className="w-full h-full text-white" />
        </div>
      )}
    </div>
  );
}
