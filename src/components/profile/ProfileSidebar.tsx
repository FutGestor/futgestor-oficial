import React from "react";
import { User, Shield, Edit3, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

interface ProfileSidebarProps {
  profile: any;
  user: any;
  fotoUrl: string | null;
  isAdmin: boolean;
  statsSummary: {
    gols: number;
    assistencias: number;
  };
  signOut: () => void;
  navigate: (path: string) => void;
  basePath: string;
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (open: boolean) => void;
  renderEditForm: () => React.ReactNode;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  profile,
  user,
  fotoUrl,
  isAdmin,
  statsSummary,
  signOut,
  navigate,
  basePath,
  isEditDialogOpen,
  setIsEditDialogOpen,
  renderEditForm
}) => {
  return (
    <div className="space-y-6">
      <Card className="bg-black/60 backdrop-blur-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="h-16 md:h-24 bg-primary/20 dark:bg-primary/30" />
        <CardContent className="px-6 pb-6 -mt-12 text-center">
          <div className="relative inline-block mb-4">
            <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-card">
              {fotoUrl ? (
                <AvatarImage src={fotoUrl} alt="Foto do Jogador" />
              ) : (
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <User className="h-10 w-10 md:h-12 md:w-12" />
                </AvatarFallback>
              )}
            </Avatar>
            {isAdmin && (
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                {renderEditForm()}
              </Dialog>
            )}
          </div>
          <h2 className="text-xl font-bold text-foreground">{profile?.nome || user?.email}</h2>
          <p className="text-sm text-muted-foreground mb-4 uppercase tracking-wider font-semibold">
            {profile?.tipo || "Usuário"}
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3 py-4 border-y border-white/5">
            <div className="bg-white/5 rounded-lg p-2 text-center group transition-colors hover:bg-white/10">
              <p className="text-lg font-black text-primary italic leading-none">{profile?.jogador_id ? statsSummary.gols : "-"}</p>
              <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Gols</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center group transition-colors hover:bg-white/10">
              <p className="text-lg font-black text-primary italic leading-none">{profile?.jogador_id ? statsSummary.assistencias : "-"}</p>
              <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Assist.</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center group transition-colors hover:bg-white/10">
              <div className="flex justify-center mb-1">
                <Badge variant="outline" className="h-4 bg-green-500/10 text-green-600 border-green-500/20 text-[8px] font-bold px-1.5 uppercase">Ativa</Badge>
              </div>
              <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest leading-none">Status</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center group transition-colors hover:bg-white/10">
              <p className="text-[10px] font-black text-foreground uppercase italic leading-none">{isAdmin ? "ADM" : "Atleta"}</p>
              <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Tipo</p>
            </div>
          </div>

          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-primary/60" />
              Membro desde {profile?.created_at ? format(new Date(profile.created_at), "MMM yyyy", { locale: ptBR }) : "--"}
            </p>
            <div className="w-full h-px bg-white/5 my-2 md:hidden" />
            <div className="flex w-full gap-2 md:hidden">
               <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 h-9 text-[10px] font-bold uppercase border-white/10 bg-white/5"
                  onClick={() => navigate(basePath || "/")}
               >
                 🏠 Início
               </Button>
               <Button 
                  variant="ghost" 
                  size="sm"
                  className="flex-1 h-9 text-[10px] font-bold uppercase text-red-500 hover:text-red-400 hover:bg-red-500/10"
                  onClick={signOut}
               >
                 Encerrar
               </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="hidden lg:flex flex-col gap-3">
        <Button 
           variant="outline" 
           className="w-full h-12 font-bold uppercase tracking-widest border-white/10 hover:bg-white/5"
           onClick={() => navigate(basePath || "/")}
        >
          🏠 Voltar ao Início
        </Button>
        <Button 
           variant="ghost" 
           className="w-full h-12 font-bold uppercase tracking-widest text-red-500 hover:text-red-400 hover:bg-red-500/10"
           onClick={signOut}
        >
          Sair do sistema
        </Button>
      </div>
    </div>
  );
};
