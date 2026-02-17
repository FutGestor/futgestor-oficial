import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SeasonSelectorProps {
  value: string; // "2026" | "2025" | "all"
  onChange: (season: string) => void;
  className?: string;
}

export function SeasonSelector({ value, onChange, className }: SeasonSelectorProps) {
  const currentYear = new Date().getFullYear();
  const startYear = 2024;
  
  // Gerar lista de anos dinamicamente de currentYear até 2024
  const years = [];
  for (let year = currentYear; year >= startYear; year--) {
    years.push(year.toString());
  }

  return (
    <div className={cn("flex items-center", className)}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-[36px] w-auto min-w-[140px] bg-black/40 border-white/10 text-white hover:bg-black/60 transition-colors gap-2 px-3 focus:ring-primary/20">
          <Calendar className="h-4 w-4 text-primary" />
          <SelectValue placeholder="Temporada" />
        </SelectTrigger>
        <SelectContent className="bg-[#040810] border-white/10 text-white">
          {years.map((year) => (
            <SelectItem 
              key={year} 
              value={year}
              className="focus:bg-primary/20 focus:text-white cursor-pointer"
            >
              Temporada: {year}
            </SelectItem>
          ))}
          <SelectItem 
            value="all"
            className="focus:bg-primary/20 focus:text-white cursor-pointer"
          >
            Todas as temporadas
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
