import { useState, useRef } from "react";
import { Camera, Upload, Save, Loader2, Instagram, MessageCircle, Youtube, Facebook, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { MeuPlanoSection } from "@/components/MeuPlanoSection";

export default function AdminConfiguracoes() {
  const { profile } = useAuth();
  const { team, isLoading: teamLoading } = useTeamConfig();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [nome, setNome] = useState("");
  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");
  const [facebook, setFacebook] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
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
    setInitialized(true);
  }

  const teamId = profile?.team_id;

  const handleUploadImage = async (file: File, type: "escudo" | "banner") => {
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
    </div>
  );
}
