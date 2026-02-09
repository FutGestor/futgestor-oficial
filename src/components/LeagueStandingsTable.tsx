import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Standing } from "@/hooks/useLeagues";

interface Props {
  standings: Standing[];
  compact?: boolean;
}

export function LeagueStandingsTable({ standings, compact = false }: Props) {
  if (standings.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">Nenhum time cadastrado ainda.</p>;
  }

  const z4Start = Math.max(1, standings.length - Math.floor(standings.length * 0.25));

  return (
    <div className="overflow-x-auto">
      <Table className="text-xs sm:text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className="w-6 sm:w-10 px-1 sm:px-2 text-center">#</TableHead>
            <TableHead className="px-1 sm:px-2">Time</TableHead>
            <TableHead className="px-1 sm:px-2 text-center font-bold">PTS</TableHead>
            <TableHead className="px-1 sm:px-2 text-center">J</TableHead>
            {!compact && (
              <>
                <TableHead className="px-1 sm:px-2 text-center">V</TableHead>
                <TableHead className="px-1 sm:px-2 text-center">E</TableHead>
                <TableHead className="px-1 sm:px-2 text-center">D</TableHead>
              </>
            )}
            <TableHead className="px-1 sm:px-2 text-center">GP</TableHead>
            <TableHead className="px-1 sm:px-2 text-center">GC</TableHead>
            <TableHead className="px-1 sm:px-2 text-center">SG</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((s, idx) => {
            const pos = idx + 1;
            const isFirst = pos === 1 && s.j > 0;
            const isZ4 = pos >= z4Start && standings.length >= 4 && s.j > 0;

            return (
              <TableRow
                key={s.teamId}
                className={cn(
                  isFirst && "bg-green-100 dark:bg-green-950/30",
                  isZ4 && "bg-red-100 dark:bg-red-950/30"
                )}
              >
                <TableCell className="px-1 sm:px-2 text-center font-bold">{pos}</TableCell>
                <TableCell className="px-1 sm:px-2">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Avatar className="h-5 w-5 sm:h-6 sm:w-6 shrink-0">
                      <AvatarImage src={s.logoUrl ?? undefined} />
                      <AvatarFallback className="text-[8px] sm:text-[10px]">
                        {s.teamName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium truncate max-w-[80px] sm:max-w-none">{s.teamName}</span>
                  </div>
                </TableCell>
                <TableCell className="px-1 sm:px-2 text-center font-bold">{s.pts}</TableCell>
                <TableCell className="px-1 sm:px-2 text-center">{s.j}</TableCell>
                {!compact && (
                  <>
                    <TableCell className="px-1 sm:px-2 text-center">{s.v}</TableCell>
                    <TableCell className="px-1 sm:px-2 text-center">{s.e}</TableCell>
                    <TableCell className="px-1 sm:px-2 text-center">{s.d}</TableCell>
                  </>
                )}
                <TableCell className="px-1 sm:px-2 text-center">{s.gp}</TableCell>
                <TableCell className="px-1 sm:px-2 text-center">{s.gc}</TableCell>
                <TableCell className="px-1 sm:px-2 text-center">{s.sg}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
