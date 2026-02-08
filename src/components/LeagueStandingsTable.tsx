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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 text-center">#</TableHead>
          <TableHead>Time</TableHead>
          <TableHead className="text-center font-bold">PTS</TableHead>
          <TableHead className="text-center">J</TableHead>
          {!compact && (
            <>
              <TableHead className="text-center">V</TableHead>
              <TableHead className="text-center">E</TableHead>
              <TableHead className="text-center">D</TableHead>
            </>
          )}
          <TableHead className="text-center">GP</TableHead>
          <TableHead className="text-center">GC</TableHead>
          <TableHead className="text-center">SG</TableHead>
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
              <TableCell className="text-center font-bold">{pos}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={s.logoUrl ?? undefined} />
                    <AvatarFallback className="text-[10px]">
                      {s.teamName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{s.teamName}</span>
                </div>
              </TableCell>
              <TableCell className="text-center font-bold">{s.pts}</TableCell>
              <TableCell className="text-center">{s.j}</TableCell>
              {!compact && (
                <>
                  <TableCell className="text-center">{s.v}</TableCell>
                  <TableCell className="text-center">{s.e}</TableCell>
                  <TableCell className="text-center">{s.d}</TableCell>
                </>
              )}
              <TableCell className="text-center">{s.gp}</TableCell>
              <TableCell className="text-center">{s.gc}</TableCell>
              <TableCell className="text-center">{s.sg}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
