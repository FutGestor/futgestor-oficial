import { useState } from "react";
import { Link2, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { usePresencaLink } from "@/hooks/usePresencaLink";
import { useToast } from "@/hooks/use-toast";

interface PresencaLinkDialogProps {
  jogoId: string;
  adversario: string;
}

export default function PresencaLinkDialog({ jogoId, adversario }: PresencaLinkDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { link, isLoading, isCreating, createLink } = usePresencaLink(jogoId);
  const { toast } = useToast();

  const handleOpen = async () => {
    setOpen(true);
    if (!link) {
      try {
        await createLink();
      } catch {
        toast({ variant: "destructive", title: "Erro ao gerar link" });
      }
    }
  };

  const fullUrl = link ? `${window.location.origin}/presenca/${link.codigo}` : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast({ title: "Link copiado!" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Button variant="outline" size="icon" onClick={handleOpen} title="Link de presença">
        <Link2 className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" onCloseAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Link de Presença — vs {adversario}</DialogTitle>
            <DialogDescription>
              Compartilhe este link para que jogadores possam confirmar presença sem login.
            </DialogDescription>
          </DialogHeader>
          {isLoading || isCreating ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Compartilhe este link no WhatsApp para que os jogadores confirmem presença sem precisar de login.
              </p>
              <div className="flex gap-2">
                <Input value={fullUrl} readOnly className="text-sm" />
                <Button onClick={handleCopy} variant="outline" size="icon" className="shrink-0">
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
