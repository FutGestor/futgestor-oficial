import React from "react";
import { Building2, Camera, Loader2, Trophy, Instagram, Youtube, Facebook, MessageCircle, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ESCUDO_PADRAO } from "@/lib/constants";

interface TeamIdentityFormProps {
  team: any;
  teamNome: string;
  setTeamNome: (val: string) => void;
  cidade: string;
  setCidade: (val: string) => void;
  estado: string;
  setEstado: (val: string) => void;
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

export const TeamIdentityForm: React.FC<TeamIdentityFormProps> = ({
  team,
  teamNome,
  setTeamNome,
  cidade,
  setCidade,
  estado,
  setEstado,
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
            <Avatar className="h-32 w-32 border-2 border-primary/30 ring-4 ring-black/50">
              <AvatarImage src={team?.escudo_url || ESCUDO_PADRAO} className="object-contain p-2" />
              <AvatarFallback><Building2 className="w-12 h-12" /></AvatarFallback>
            </Avatar>
            <button 
              onClick={() => escudoInputRef.current?.click()}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Cidade</Label>
                <Input value={cidade} onChange={e => setCidade(e.target.value)} className="bg-black/20 border-white/10 h-12" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">UF</Label>
                <Input 
                  value={estado} 
                  onChange={e => setEstado(e.target.value)} 
                  maxLength={2} 
                  className="bg-black/20 border-white/10 h-12 uppercase" 
                  placeholder="UF"
                />
              </div>
            </div>
          </div>
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
