import { Sword, Copy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function ChallengeLinkCard({ teamSlug }: { teamSlug: string }) {
  const { toast } = useToast();
  const challengeUrl = `${window.location.origin}/time/${teamSlug}/desafio`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(challengeUrl);
    toast({
      title: "Link copiado!",
      description: "Compartilhe para receber desafios.",
    });
  };

  return (
    <Card className="border border-white/10 bg-black/40 backdrop-blur-xl p-4 overflow-hidden group">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/20">
          <Sword className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-xs font-black uppercase italic tracking-[0.2em] text-white">Link de Desafio</h3>
      </div>
      
      <p className="text-[11px] text-muted-foreground mb-3 px-1 font-medium">
        Receba solicitações de jogos de times externos.
      </p>

      <div className="flex items-center gap-2">
        <div className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white/60 truncate font-mono">
          {challengeUrl}
        </div>
        <Button 
          size="icon" 
          variant="secondary" 
          className="h-9 w-9 shrink-0"
          onClick={copyToClipboard}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
