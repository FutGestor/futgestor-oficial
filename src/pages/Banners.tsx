import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { useProximoJogo, useUltimoResultado } from "@/hooks/useData";
import { useRanking } from "@/hooks/useEstatisticas";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Image as ImageIcon, Download, Share2, Smartphone, Monitor, ChevronLeft } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MatchDayBanner } from "@/components/banners/MatchDayBanner";
import { ResultBanner } from "@/components/banners/ResultBanner";
import { TopScorerBanner } from "@/components/banners/TopScorerBanner";

export default function Banners() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { team, basePath } = useTeamSlug();
  const [format, setFormat] = useState<"story" | "feed">("feed");
  const [activeTab, setActiveTab] = useState("matchday");
  const bannerRef = useRef<HTMLDivElement>(null);

  // Data fetching
  const { data: proximoJogo, isLoading: loadingNext } = useProximoJogo(team.id);
  const { data: ultimoResultado, isLoading: loadingResult } = useUltimoResultado(team.id);
  const { data: ranking, isLoading: loadingRanking } = useRanking(team.id);

  const handleDownload = async () => {
    if (!bannerRef.current) return;
    
    try {
      const dataUrl = await toPng(bannerRef.current, {
        quality: 0.95,
        pixelRatio: 2, // Melhora a qualidade para redes sociais
      });
      
      const link = document.createElement("a");
      link.download = `banner-${activeTab}-${format}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success("Banner baixado com sucesso!");
    } catch (err) {
      console.error("Erro ao gerar imagem:", err);
      toast.error("Erro ao gerar imagem do banner.");
    }
  };

  const handleShare = async () => {
    if (!bannerRef.current) return;

    try {
      const dataUrl = await toPng(bannerRef.current, { quality: 0.95, pixelRatio: 2 });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `banner-${activeTab}.png`, { type: "image/png" });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Banner - ${team.nome}`,
          text: "Confira as atualizações do meu time no FutGestor!",
        });
      } else {
        // Fallback para download se não suportar share de arquivo
        handleDownload();
      }
    } catch (err) {
      console.error("Erro ao compartilhar:", err);
      toast.error("Erro ao compartilhar o banner.");
    }
  };

  if (loadingNext || loadingResult || loadingRanking) {
    return <LoadingScreen />;
  }

  const artilheiro = ranking?.artilheiros?.[0];

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(basePath)}
              className="pl-0 text-slate-400 hover:text-white"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Voltar ao Início
            </Button>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">
              📣 Banners do <span className="text-primary">Time</span>
            </h1>
            <p className="text-slate-400">Crie imagens profissionais para compartilhar no WhatsApp e Instagram.</p>
          </div>

          <div className="flex bg-black/40 backdrop-blur-sm p-1 rounded-xl border border-white/5 self-start">
            <Button
              variant={format === "feed" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFormat("feed")}
              className="rounded-lg h-9"
            >
              <Monitor className="mr-2 h-4 w-4" />
              Feed (1:1)
            </Button>
            <Button
              variant={format === "story" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFormat("story")}
              className="rounded-lg h-9"
            >
              <Smartphone className="mr-2 h-4 w-4" />
              Story (9:16)
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-6">
            <Card className="bg-black/60 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white uppercase italic font-black tracking-tight">Templates</CardTitle>
                <CardDescription className="text-slate-400">Selecione o tipo de postagem</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-col">
                  {[
                    { id: "matchday", label: "Dia de Jogo", icon: ImageIcon, desc: "Próxima partida agendada" },
                    { id: "result", label: "Resultado", icon: ImageIcon, desc: "Placar do último jogo" },
                    { id: "topscorer", label: "Artilheiro", icon: ImageIcon, desc: "Goleador da temporada" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        "flex items-center gap-4 p-4 text-left border-l-4 transition-all hover:bg-white/5",
                        activeTab === item.id 
                          ? "border-primary bg-primary/10" 
                          : "border-transparent text-slate-400"
                      )}
                    >
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center border",
                        activeTab === item.id ? "bg-primary/20 border-primary/30 text-primary" : "bg-black/40 border-white/5"
                      )}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className={cn("font-bold uppercase italic", activeTab === item.id ? "text-white" : "text-slate-400")}>
                          {item.label}
                        </div>
                        <div className="text-xs text-slate-500">{item.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={handleDownload}
                className="bg-primary hover:bg-primary/90 text-white font-black uppercase italic h-12"
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar
              </Button>
              <Button 
                variant="outline"
                onClick={handleShare}
                className="border-white/10 text-white hover:bg-white/5 font-black uppercase italic h-12"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Compartilhar
              </Button>
            </div>
          </div>

          <div className="lg:col-span-8 flex justify-center">
            {/* Preview Container */}
            <div className="relative group max-w-full overflow-hidden">
               {/* Container real para o html-to-image (escondido ou overflow-hidden) */}
               <div className="absolute opacity-0 pointer-events-none" style={{ left: '-9999px' }}>
                  <div ref={bannerRef}>
                    {activeTab === "matchday" && (
                      <MatchDayBanner 
                        team={team} 
                        jogo={proximoJogo} 
                        format={format} 
                      />
                    )}
                    {activeTab === "result" && (
                      <ResultBanner 
                        team={team} 
                        resultado={ultimoResultado} 
                        format={format} 
                      />
                    )}
                    {activeTab === "topscorer" && (
                      <TopScorerBanner 
                        team={team} 
                        jogador={artilheiro?.jogador}
                        gols={artilheiro?.gols}
                        format={format} 
                      />
                    )}
                  </div>
               </div>

               {/* Visual Preview (Reduzido) */}
               <div className={cn(
                 "bg-black/60 rounded-2xl border border-white/10 p-4 shadow-2xl flex items-center justify-center overflow-auto max-h-[700px]",
                 format === "story" ? "aspect-[9/16] w-[350px]" : "aspect-square w-[450px]"
               )}>
                  <div className="scale-[0.4] origin-center">
                    {activeTab === "matchday" && (
                      <MatchDayBanner 
                        team={team} 
                        jogo={proximoJogo} 
                        format={format} 
                      />
                    )}
                    {activeTab === "result" && (
                      <ResultBanner 
                        team={team} 
                        resultado={ultimoResultado} 
                        format={format} 
                      />
                    )}
                    {activeTab === "topscorer" && (
                      <TopScorerBanner 
                        team={team} 
                        jogador={artilheiro?.jogador}
                        gols={artilheiro?.gols}
                        format={format} 
                      />
                    )}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
