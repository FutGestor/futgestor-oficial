import { useRef } from "react";
import { useJogadoresPublicos } from "@/hooks/useData";
import { usePlanAccess } from "@/hooks/useSubscription";
import { StickerCard } from "./StickerCard";
import { Button } from "@/components/ui/button";
import { Lock, Download } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";

interface StickerAlbumProps {
  teamId: string;
  layout?: 'grid' | 'carousel';
}

export function StickerAlbum({ teamId, layout = 'grid' }: StickerAlbumProps) {
  const { data: jogadores, isLoading } = useJogadoresPublicos(teamId);
  const { hasAlbumFigurinhas } = usePlanAccess(teamId);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleDownload = async (jogadorId: string, nome: string) => {
    const element = cardRefs.current[jogadorId];
    if (!element) return;

    try {
      const dataUrl = await toPng(element, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `card-${nome.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Card baixado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar a imagem.");
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando álbum...</div>;
  }

  // --- Caso sem permissão (Plano Liga necessário) ---
  if (!hasAlbumFigurinhas) {
    return (
      <div className="relative rounded-xl border border-border bg-card p-6 overflow-hidden min-h-[400px]">
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
          <Lock className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-2xl font-bold mb-2">Álbum de Figurinhas Exclusivo</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Desbloqueie o álbum digital do seu time e gere cards estilo FIFA para compartilhar no Instagram. Disponível no plano Liga.
          </p>
          <Button size="lg" className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white border-0">
            Fazer Upgrade para Liga
          </Button>
        </div>
        
        {/* Mock background content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-50 blur-sm pointer-events-none">
          {[1, 2, 3, 4].map((i) => (
             <div key={i} className="bg-muted h-64 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // --- Caso com permissão ---
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Álbum de Figurinhas</h2>
          <p className="text-muted-foreground">Cards oficiais da temporada. Baixe e compartilhe!</p>
        </div>
      </div>

      {layout === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
          {jogadores?.map((jogador) => (
            <div key={jogador.id} className="flex flex-col items-center gap-3 group">
              <div ref={(el) => (cardRefs.current[jogador.id] = el)}>
                <StickerCard 
                  jogador={jogador} 
                  className="transform transition-transform group-hover:-translate-y-2 duration-300"
                  variant="gold" 
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 w-full max-w-[12rem]"
                onClick={() => handleDownload(jogador.id, jogador.apelido || jogador.nome)}
              >
                <Download className="h-4 w-4" />
                Baixar Card PNG
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory px-4 -mx-4 scrollbar-hide">
          {jogadores?.map((jogador) => (
            <div key={jogador.id} className="flex-none snap-center flex flex-col items-center gap-3 group">
              <div ref={(el) => (cardRefs.current[jogador.id] = el)}>
                <StickerCard 
                  jogador={jogador} 
                  className="transform transition-transform group-hover:-translate-y-2 duration-300 scale-90 sm:scale-100 origin-top"
                  variant="gold" 
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 w-full max-w-[12rem]"
                onClick={() => handleDownload(jogador.id, jogador.apelido || jogador.nome)}
              >
                <Download className="h-4 w-4" />
                Baixar
              </Button>
            </div>
          ))}
        </div>
      )}

      {jogadores?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum jogador cadastrado no elenco.
        </div>
      )}
    </div>
  );
}
