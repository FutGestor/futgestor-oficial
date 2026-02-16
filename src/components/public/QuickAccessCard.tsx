import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export function QuickAccessCard({ to, icon: Icon, label, className }: { to: string, icon: LucideIcon, label: string, className?: string }) {
  return (
    <Link to={to} className="group">
      <div className={cn(
        "flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all duration-300",
        "bg-black/30 backdrop-blur-xl border border-white/10",
        "hover:bg-primary/20 hover:border-primary/30 hover:scale-[1.02] active:scale-[0.98]",
        "min-h-[100px] md:min-h-[120px]",
        className
      )}>
        <Icon className="h-7 w-7 text-primary group-hover:text-white transition-colors duration-300" />
        <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-white transition-colors duration-300 text-center">
          {label}
        </span>
      </div>
    </Link>
  );
}
