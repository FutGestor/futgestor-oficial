import React, { useState } from "react";
import { Building2, Camera, Loader2, Trophy, Instagram, Youtube, Facebook, MessageCircle, Save, MapPin, Gamepad2, Users, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ESCUDO_PADRAO } from "@/lib/constants";
import { TeamShield } from "@/components/TeamShield";
import { useToast } from "@/hooks/use-toast";

interface TeamIdentityFormProps {
  team: any;
  teamNome: string;
  setTeamNome: (val: string) => void;
  cidade: string;
  setCidade: (val: string) => void;
  estado: string;
  setEstado: (val: string) => void;
  bio: string;
  setBio: (val: string) => void;
  modalidade: string;
  setModalidade: (val: string) => void;
  faixaEtaria: string;
  setFaixaEtaria: (val: string) => void;
  genero: string;
  setGenero: (val: string) => void;
  instagram: string;
  setInstagram: (val: string) => void;
  youtube: string;
  setYoutube: (val: string) => void;
  facebook: string;
  setFacebook: (val: string) => void;
  whatsapp: string;
  setWhatsapp: (val: string) => void;
  onSaveTeam: () => void;
  savingTeam: boolean;
  uploadingEscudo: boolean;
  handleEscudoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  escudoInputRef: React.RefObject<HTMLInputElement>;
}

const formatCep = (value: string) => {
  const numbers = value.replace(/\D/g, "").slice(0, 8);
  if (numbers.length > 5) return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
  return numbers;
};

export const TeamIdentityForm: React.FC<TeamIdentityFormProps> = ({
  team,
  teamNome,
  setTeamNome,
  cidade,
  setCidade,
  estado,
  setEstado,
  bio,
  setBio,
  modalidade,
  setModalidade,
  faixaEtaria,
  setFaixaEtaria,
  genero,
  setGenero,
  instagram,
  setInstagram,
  youtube,
  setYoutube,
  facebook,
  setFacebook,
  whatsapp,
  setWhatsapp,
  onSaveTeam,
  savingTeam,
  uploadingEscudo,
  handleEscudoUpload,
  escudoInputRef
}) => {
  const { toast } = useToast();
  const [cep, setCep] = useState("");
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const fetchCep = async (cepValue: string) => {
    const rawCep = cepValue.replace(/\D/g, "");
    if (rawCep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast({ variant: "destructive", title: "CEP não encontrado", description: "Verifique o CEP digitado." });
        return;
      }

      setCidade(data.localidade);
      setEstado(data.uf);
      toast({ title: "Localização atualizada!", description: `${data.localidade} - ${data.uf}` });
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao buscar CEP." });
    } finally {
      setIsLoadingCep(false);
    }
  };

  return (
    <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" /> Identidade Visual do Clube
        </CardTitle>
        <CardDescription className="text-muted-foreground">Como o seu time é visto publicamente.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="flex flex-col md:flex-row items-center gap-8 border-b border-white/5 pb-8">
          <div className="relative group">
            <TeamShield 
              escudoUrl={team?.escudo_url} 
              teamName={teamNome} 
              size="2xl" 
            />
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                escudoInputRef.current?.click();
              }}
              className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {uploadingEscudo ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Camera className="w-6 h-6 text-white" />}
            </button>
            <input 
              ref={escudoInputRef} 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleEscudoUpload}
              title="Upload do Escudo do Time"
            />
          </div>
          <div className="flex-1 space-y-4 w-full">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Nome do Clube</Label>
              <Input 
                value={teamNome} 
                onChange={e => setTeamNome(e.target.value)} 
                className="bg-black/20 border-white/10 h-12 font-bold text-lg"
              />
            </div>

            {/* CEP-based city input */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Alterar Localização via CEP
              </Label>
              <div className="relative">
                <Input 
                  value={cep} 
                  onChange={(e) => {
                    const formatted = formatCep(e.target.value);
                    setCep(formatted);
                    if (formatted.length === 9) fetchCep(formatted);
                    if (formatted.length === 0) {
                      // Don't clear existing values on empty
                    }
                  }}
                  placeholder="Digite o CEP para atualizar"
                  className="bg-black/20 border-white/10 h-12"
                />
                {isLoadingCep && <Loader2 className="absolute right-3 top-3.5 h-4 w-4 animate-spin text-primary" />}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Cidade</Label>
                <Input 
                  value={cidade} 
                  readOnly 
                  className="bg-black/30 border-white/5 h-12 text-zinc-400 cursor-not-allowed" 
                  placeholder="Preenchido via CEP"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">UF</Label>
                <Input 
                  value={estado} 
                  readOnly 
                  maxLength={2} 
                  className="bg-black/30 border-white/5 h-12 uppercase text-zinc-400 cursor-not-allowed" 
                  placeholder="UF"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Classificação - Modalidade, Faixa Etária, Gênero */}
        <div className="space-y-4 border-t border-white/5 pt-6">
          <Label className="text-sm font-semibold uppercase tracking-tighter text-primary flex items-center gap-2">
            <Target className="w-4 h-4" /> Classificação do Time
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Modalidade</Label>
              <Select value={modalidade} onValueChange={setModalidade}>
                <SelectTrigger className="bg-black/20 border-white/10 h-12">
                  <Gamepad2 className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="society_7">Society (7x7)</SelectItem>
                  <SelectItem value="society_5">Society (5x5)</SelectItem>
                  <SelectItem value="campo_11">Campo (11x11)</SelectItem>
                  <SelectItem value="campo_7">Campo (7x7)</SelectItem>
                  <SelectItem value="futsal">Futsal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Faixa Etária</Label>
              <Select value={faixaEtaria} onValueChange={setFaixaEtaria}>
                <SelectTrigger className="bg-black/20 border-white/10 h-12">
                  <Trophy className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="livre">Livre / Aberto</SelectItem>
                  <SelectItem value="sub_30">Sub-30</SelectItem>
                  <SelectItem value="sub_25">Sub-25</SelectItem>
                  <SelectItem value="sub_20">Sub-20</SelectItem>
                  <SelectItem value="sub_17">Sub-17</SelectItem>
                  <SelectItem value="sub_15">Sub-15</SelectItem>
                  <SelectItem value="master_35">Master (35+)</SelectItem>
                  <SelectItem value="master_40">Master (40+)</SelectItem>
                  <SelectItem value="master_50">Master (50+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Gênero</Label>
              <Select value={genero} onValueChange={setGenero}>
                <SelectTrigger className="bg-black/20 border-white/10 h-12">
                  <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                  <SelectItem value="misto">Misto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Bio / About */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold uppercase tracking-tighter text-primary">Bio / Sobre o Time</Label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            placeholder="Conte a história do seu time... Ex: Somos um time de amigos que joga toda quarta às 19h."
            className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-4 h-24 text-sm resize-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none"
          />
          <p className="text-[10px] text-muted-foreground text-right">{bio.length}/500</p>
        </div>

        <div className="space-y-4">
          <Label className="text-sm font-semibold uppercase tracking-tighter text-primary">Redes Sociais</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="Instagram URL" className="pl-10 bg-black/20 border-white/10 h-12" />
            </div>
            <div className="relative">
              <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={youtube} onChange={e => setYoutube(e.target.value)} placeholder="YouTube URL" className="pl-10 bg-black/20 border-white/10 h-12" />
            </div>
            <div className="relative">
              <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="Facebook URL" className="pl-10 bg-black/20 border-white/10 h-12" />
            </div>
            <div className="relative">
              <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="Link do WhatsApp" className="pl-10 bg-black/20 border-white/10 h-12" />
            </div>
          </div>
        </div>

        <Button onClick={onSaveTeam} className="w-full h-14 bg-primary hover:bg-primary/90 text-black font-black uppercase italic rounded-xl gap-2 shadow-lg shadow-primary/20" disabled={savingTeam}>
          {savingTeam ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> ATUALIZAR IDENTIDADE DO CLUBE</>}
        </Button>
      </CardContent>
    </Card>
  );
};
