import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SolicitacaoJogoForm } from "@/components/SolicitacaoJogoForm";

interface ScheduleGameCardProps {
  teamId?: string;
}

export function ScheduleGameCard({ teamId }: ScheduleGameCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Card className="border border-dashed border-primary/30 bg-black/20 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3 p-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-3 text-left">
            <div className="p-2 rounded-lg bg-primary/10">
              <CalendarPlus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Quer jogar contra a gente?</h3>
              <p className="text-[11px] text-muted-foreground leading-tight max-w-[280px]">Agende uma partida amistosa enviando uma proposta.</p>
            </div>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            size="sm"
            variant="secondary"
            className="w-full md:w-auto text-xs font-black uppercase tracking-widest h-9 px-4"
          >
            Agendar Partida
          </Button>
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Solicitar Partida</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para solicitar um jogo amistoso. Entraremos
              em contato para confirmar.
            </DialogDescription>
          </DialogHeader>
          <SolicitacaoJogoForm teamId={teamId} onSuccess={() => { }} />
        </DialogContent>
      </Dialog>
    </>
  );
}
