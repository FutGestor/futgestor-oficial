import { useState, useRef } from "react";
import { Camera, Upload, Save, Loader2, Instagram, MessageCircle, Youtube, Facebook, Settings, Code2, AlignLeft, AlignCenter, AlignRight, Type } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { MeuPlanoSection } from "@/components/MeuPlanoSection";
import { useCurrentPlan } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

export default function AdminConfiguracoes() {
  const { profile, user } = useAuth();
  const { team, isLoading: teamLoading } = useTeamConfig();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [nome, setNome] = useState("");
  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");
  const [facebook, setFacebook] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [corPrincipal, setCorPrincipal] = useState("#000000");
  const [bio, setBio] = useState("");
  const [bioColor, setBioColor] = useState("#FFFFFF");
  const [bioFontSize, setBioFontSize] = useState("text-lg");
  const [bioFontWeight, setBioFontWeight] = useState("font-normal");
  const [bioTextAlign, setBioTextAlign] = useState("text-center");
  const [saving, setSaving] = useState(false);
  const [uploadingEscudo, setUploadingEscudo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const escudoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with team data once loaded
  if (team && team.id && !initialized) {
    setNome(team.nome);
    setInstagram(team.redes_sociais?.instagram || "");
    setYoutube(team.redes_sociais?.youtube || "");
    setFacebook(team.redes_sociais?.facebook || "");
    setWhatsapp(team.redes_sociais?.whatsapp || "");
    setCorPrincipal(team.cores?.primary || "#222222"); // Default dark gray if not set

    // Bio settings
    const bioConfig = team.bio_config as any;
    setBio(bioConfig?.text || "");
    setBioColor(bioConfig?.color || "#FFFFFF");
    setBioFontSize(bioConfig?.fontSize || "text-lg");
    setBioFontWeight(bioConfig?.fontWeight || "font-normal");
    setBioTextAlign(bioConfig?.textAlign || "text-center");

    setInitialized(true);
  }

  const teamId = profile?.team_id;

  const handleUploadImage = async (file: File, type: "escudo" | "banner") => {
    // ... (upload logic remains unchanged, omitted for brevity if not changing)
    if (!teamId) return;
    const setUploading = type === "escudo" ? setUploadingEscudo : setUploadingBanner;
    setUploading(true);

    try {
      const ext = file.name.split(".").pop();
      const path = `${teamId}/${type}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("times")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("times")
        .getPublicUrl(path);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const updateField = type === "escudo" ? "escudo_url" : "banner_url";
      const { error: updateError } = await supabase
        .from("teams")
        .update({ [updateField]: publicUrl })
        .eq("id", teamId);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["team-config"] });
      queryClient.invalidateQueries({ queryKey: ["team-by-slug"] });

      toast({
        title: "Imagem atualizada",
        description: `${type === "escudo" ? "Escudo" : "Banner"} atualizado com sucesso.`,
      });
    } catch (error: any) {
      console.error(`Error uploading ${type}:`, error);
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível enviar a imagem.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!teamId) return;
    setSaving(true);

    try {
      const redes_sociais: Record<string, string> = {};
      if (instagram.trim()) redes_sociais.instagram = instagram.trim();
      if (youtube.trim()) redes_sociais.youtube = youtube.trim();
      if (facebook.trim()) redes_sociais.facebook = facebook.trim();
      if (whatsapp.trim()) redes_sociais.whatsapp = whatsapp.trim();

      const { error } = await supabase
        .from("teams")
        .update({
          nome: nome.trim(),
          redes_sociais,
          cores: { primary: corPrincipal },
          bio_config: {
            text: bio.trim() || null,
            color: bioColor,
            fontSize: bioFontSize,
            fontWeight: bioFontWeight,
            textAlign: bioTextAlign
          }
        })
        .eq("id", teamId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["team-config"] });
      queryClient.invalidateQueries({ queryKey: ["team-by-slug"] });

      toast({
        title: "Configurações salvas",
        description: "As informações do time foram atualizadas.",
      });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (teamLoading || !team?.id) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Identidade do Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Identidade do Time
          </CardTitle>
          <CardDescription>Escudo, banner e nome do time</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Escudo + Banner side by side */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Escudo */}
            <div>
              <Label className="mb-2 block">Escudo</Label>
              <div
                onClick={() => escudoInputRef.current?.click()}
                className="group relative flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted transition-colors hover:border-primary"
              >
                {team.escudo_url ? (
                  <img src={team.escudo_url} alt="Escudo" className="h-full w-full object-contain p-2" />
                ) : (
                  <Camera className="h-8 w-8 text-muted-foreground" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  {uploadingEscudo ? (
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  ) : (
                    <Upload className="h-6 w-6 text-white" />
                  )}
                </div>
              </div>
              <input
                ref={escudoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadImage(file, "escudo");
                }}
              />
            </div>

            {/* Banner */}
            <div>
              <Label className="mb-2 block">Banner / Capa</Label>
              <div
                onClick={() => bannerInputRef.current?.click()}
                className="group relative flex h-32 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted transition-colors hover:border-primary"
              >
                {(team as any).banner_url ? (
                  <img src={(team as any).banner_url} alt="Banner" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Camera className="h-8 w-8" />
                    <span className="text-xs">Foto de capa</span>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  {uploadingBanner ? (
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  ) : (
                    <Upload className="h-6 w-6 text-white" />
                  )}
                </div>
              </div>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadImage(file, "banner");
                }}
              />
            </div>
          </div>

          {/* Nome */}
          <div>
            <Label htmlFor="nome">Nome do Time</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do time"
              className="mt-1.5"
            />
          </div>

          {/* Cor Principal */}
          <div>
            <Label htmlFor="corPrincipal">Cor Principal do Time</Label>
            <div className="mt-1.5 flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-full border border-border shadow-sm"
                style={{ backgroundColor: corPrincipal }}
              />
              <Input
                id="corPrincipal"
                type="color"
                value={corPrincipal}
                onChange={(e) => setCorPrincipal(e.target.value)}
                className="h-10 w-20 p-1 cursor-pointer"
              />
              <Input
                value={corPrincipal}
                onChange={(e) => setCorPrincipal(e.target.value)}
                placeholder="#000000"
                className="w-32 font-mono uppercase"
                maxLength={7}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Esta cor será usada no cabeçalho e em botões principais do seu site.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Personalização da Bio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Bio / Descrição da Capa
          </CardTitle>
          <CardDescription>Configure o texto e o estilo que aparece sobre a foto de capa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="bio">Texto da Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ex: Gerencie seu time de futebol. Agenda, escalações, resultados..."
              className="mt-1.5 min-h-[100px]"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Cor da Bio */}
            <div>
              <Label htmlFor="bioColor">Cor do Texto</Label>
              <div className="mt-1.5 flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-full border border-border shadow-sm"
                  style={{ backgroundColor: bioColor }}
                />
                <Input
                  id="bioColor"
                  type="color"
                  value={bioColor}
                  onChange={(e) => setBioColor(e.target.value)}
                  className="h-10 w-20 p-1 cursor-pointer"
                />
                <Input
                  value={bioColor}
                  onChange={(e) => setBioColor(e.target.value)}
                  placeholder="#FFFFFF"
                  className="w-32 font-mono uppercase"
                  maxLength={7}
                />
              </div>
            </div>

            {/* Tamanho da Fonte */}
            <div>
              <Label>Tamanho da Fonte</Label>
              <Select value={bioFontSize} onValueChange={setBioFontSize}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text-sm">Pequena</SelectItem>
                  <SelectItem value="text-base">Média</SelectItem>
                  <SelectItem value="text-lg">Grande (Padrão)</SelectItem>
                  <SelectItem value="text-xl">Extra Grande</SelectItem>
                  <SelectItem value="text-2xl">Gigante</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Peso da Fonte */}
            <div>
              <Label>Estilo / Peso</Label>
              <Select value={bioFontWeight} onValueChange={setBioFontWeight}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="font-light">Fina</SelectItem>
                  <SelectItem value="font-normal">Normal</SelectItem>
                  <SelectItem value="font-medium">Média</SelectItem>
                  <SelectItem value="font-semibold">Semi-negrito</SelectItem>
                  <SelectItem value="font-bold">Negrito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Alinhamento */}
            <div>
              <Label>Alinhamento</Label>
              <div className="mt-1.5 flex gap-2">
                <Button
                  variant={bioTextAlign === "text-left" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setBioTextAlign("text-left")}
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant={bioTextAlign === "text-center" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setBioTextAlign("text-center")}
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                  variant={bioTextAlign === "text-right" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setBioTextAlign("text-right")}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-lg border bg-muted p-4">
            <Label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground font-semibold">Preview na Capa</Label>
            <div
              className="relative aspect-[3/1] w-full rounded-md bg-zinc-800 flex items-center justify-center p-4 overflow-hidden"
              style={{
                backgroundImage: team.banner_url ? `url(${team.banner_url})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-black/40" />
              <p
                className={cn("relative z-10 w-full max-w-lg shadow-sm drop-shadow-md", bioFontSize, bioFontWeight, bioTextAlign)}
                style={{ color: bioColor }}
              >
                {bio || "Bem-vindo à página do time. Gerencie seu time de futebol em um só lugar."}
              </p>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground italic text-center">
              * O fundo escurecido (overlay) da foto de capa ajuda na leitura mas você também pode ajustar a cor do texto acima.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Redes Sociais */}
      <Card>
        <CardHeader>
          <CardTitle>Redes Sociais</CardTitle>
          <CardDescription>Links que aparecerão na página pública do time</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="instagram" className="flex items-center gap-2">
                <Instagram className="h-4 w-4" />
                Instagram
              </Label>
              <Input
                id="instagram"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/seutime"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="youtube" className="flex items-center gap-2">
                <Youtube className="h-4 w-4" />
                YouTube
              </Label>
              <Input
                id="youtube"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="https://youtube.com/@seutime"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="facebook" className="flex items-center gap-2">
                <Facebook className="h-4 w-4" />
                Facebook
              </Label>
              <Input
                id="facebook"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="https://facebook.com/seutime"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="whatsapp" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Label>
              <Input
                id="whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="https://wa.me/5511999999999"
                className="mt-1.5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Salvar Configurações
          </>
        )}
      </Button>

      {/* Meu Plano */}
      <MeuPlanoSection />

      {/* Modo Desenvolvedor - only for super admin */}
      {user?.email?.toLowerCase() === "futgestor@gmail.com" && (
        <DevModeSection teamId={teamId} />
      )}
    </div>
  );
}

function DevModeSection({ teamId }: { teamId: string | null | undefined }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { plan } = useCurrentPlan(teamId);
  const isSimulating = typeof window !== "undefined" && localStorage.getItem("simulatingPlan") === "true";
  const [loading, setLoading] = useState(false);

  const handleSimulatePlan = async (plano: string) => {
    if (!teamId) return;
    setLoading(true);
    try {
      // Check if subscription exists
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("team_id", teamId)
        .maybeSingle();

      if (existing) {
        await supabase.from("subscriptions").update({ plano, status: "active" }).eq("team_id", teamId);
      } else {
        await supabase.from("subscriptions").insert({ team_id: teamId, plano, status: "active" });
      }

      localStorage.setItem("simulatingPlan", "true");
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      toast({ title: "Plano simulado", description: `Simulando plano: ${plano}` });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      await supabase.from("subscriptions").delete().eq("team_id", teamId);
      localStorage.removeItem("simulatingPlan");
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      toast({ title: "Plano resetado", description: "Voltou ao plano real (sem assinatura)." });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Code2 className="h-5 w-5" />
          Modo Desenvolvedor
        </CardTitle>
        <CardDescription>
          Simule planos para testar restrições. Plano atual: <strong>{plan}</strong>
          {isSimulating && <span className="ml-2 text-xs text-destructive font-bold">(SIMULANDO)</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="mb-1.5 block">Simular Plano</Label>
          <Select onValueChange={handleSimulatePlan} disabled={loading}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Selecionar plano..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basico">Básico</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="liga">Liga</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={handleReset} disabled={loading} className="border-destructive/30 text-destructive hover:bg-destructive/10">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Resetar para plano real
        </Button>
      </CardContent>
    </Card>
  );
}
