import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Filter } from "lucide-react";

interface MonthSelectorProps {
  value: string; // "1" - "12" | "all"
  onChange: (month: string) => void;
  className?: string;
}

export function MonthSelector({ value, onChange, className }: MonthSelectorProps) {
  const months = [
    { value: "0", label: "Janeiro" },
    { value: "1", label: "Fevereiro" },
    { value: "2", label: "Março" },
    { value: "3", label: "Abril" },
    { value: "4", label: "Maio" },
    { value: "5", label: "Junho" },
    { value: "6", label: "Julho" },
    { value: "7", label: "Agosto" },
    { value: "8", label: "Setembro" },
    { value: "9", label: "Outubro" },
    { value: "10", label: "Novembro" },
    { value: "11", label: "Dezembro" },
  ];

  return (
    <div className={cn("flex items-center", className)}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-[36px] w-auto min-w-[130px] bg-black/40 border-white/10 text-white hover:bg-black/60 transition-colors gap-2 px-3 focus:ring-primary/20">
          <Filter className="h-4 w-4 text-primary" />
          <SelectValue placeholder="Mês" />
        </SelectTrigger>
        <SelectContent className="bg-[#040810] border-white/10 text-white">
          <SelectItem 
            value="all"
            className="focus:bg-primary/20 focus:text-white cursor-pointer"
          >
            Todos os meses
          </SelectItem>
          {months.map((month) => (
            <SelectItem 
              key={month.value} 
              value={month.value}
              className="focus:bg-primary/20 focus:text-white cursor-pointer"
            >
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
