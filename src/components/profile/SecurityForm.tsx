import React from "react";
import { Zap, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { PlayerSelfDelete } from "@/components/player/PlayerSelfDelete";

interface SecurityFormProps {
  pwForm: UseFormReturn<any>;
  isUpdatingPassword: boolean;
  onUpdatePassword: (data: any) => void;
  playerName?: string;
}

export const SecurityForm: React.FC<SecurityFormProps> = ({
  pwForm,
  isUpdatingPassword,
  onUpdatePassword,
  playerName
}) => {
  return (
    <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" /> Segurança da Conta
        </CardTitle>
        <CardDescription className="text-muted-foreground">Proteja o seu acesso ao painel tático.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="atual" className="text-muted-foreground">Senha Atual</Label>
            <Input
              id="atual"
              type="password"
              {...pwForm.register("atual")}
              className="bg-black/20 border-white/10 text-foreground h-12"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nova" className="text-muted-foreground">Nova Senha</Label>
              <Input
                id="nova"
                type="password"
                {...pwForm.register("nova")}
                className="bg-black/20 border-white/10 text-foreground h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmar" className="text-muted-foreground">Confirmar Nova Senha</Label>
              <Input
                id="confirmar"
                type="password"
                {...pwForm.register("confirmar")}
                className="bg-black/20 border-white/10 text-foreground h-12"
              />
            </div>
          </div>
        </div>
        <Button 
          className="w-full h-12 font-bold uppercase tracking-wider" 
          disabled={isUpdatingPassword}
          onClick={pwForm.handleSubmit(onUpdatePassword)}
        >
          {isUpdatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : "Atualizar Senha"}
        </Button>

        {/* Auto-exclusão de conta - apenas para jogadores (não admins) */}
        {playerName && (
          <div className="pt-6 border-t border-white/10">
            <h4 className="text-sm font-medium text-muted-foreground mb-4">
              Zona de Perigo
            </h4>
            <PlayerSelfDelete playerName={playerName} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
