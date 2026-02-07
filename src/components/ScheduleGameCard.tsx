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
      <Card className="border-2 border-dashed border-primary/50 bg-gradient-to-r from-primary/5 via-secondary/10 to-primary/5">
        <div className="flex flex-col items-center gap-4 p-6 md:flex-row md:justify-between">
          <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
            <CalendarPlus className="h-12 w-12 text-primary" />
            <div>
              <h3 className="text-xl font-bold text-primary">Quer jogar contra a gente?</h3>
              <p className="text-muted-foreground">Agende uma partida amistosa! Envie uma proposta com a data e local de sua preferência.</p>
            </div>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            size="lg"
            variant="secondary"
            className="w-full md:w-auto"
          >
            <CalendarPlus className="mr-2 h-5 w-5" />
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
          <SolicitacaoJogoForm teamId={teamId} onSuccess={() => {}} />
        </DialogContent>
      </Dialog>
    </>
  );
}
