import React from "react";
import { UserCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { positionLabels } from "@/lib/types";

interface BasicInfoFormProps {
  form: UseFormReturn<any>;
  user: any;
  isSaving: boolean;
  onSubmit: (data: any) => void;
}

export const BasicInfoForm: React.FC<BasicInfoFormProps> = ({
  form,
  user,
  isSaving,
  onSubmit
}) => {
  return (
    <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <UserCircle className="w-5 h-5 text-primary" /> Informações Básicas
        </CardTitle>
        <CardDescription className="text-muted-foreground">Seus dados como gestor da plataforma.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-muted-foreground">Nome Completo</Label>
            <Input
              id="nome"
              value={form.watch("nome")}
              onChange={(e) => form.setValue("nome", e.target.value)}
              className="bg-black/20 border-white/10 text-foreground h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-muted-foreground">E-mail</Label>
            <Input
              id="email"
              value={user?.email || ""}
              disabled
              className="bg-black/40 border-white/5 text-muted-foreground h-12"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="telefone" className="text-muted-foreground">WhatsApp</Label>
            <Input
              id="telefone"
              value={form.watch("telefone")}
              onChange={(e) => form.setValue("telefone", e.target.value)}
              placeholder="(00) 00000-0000"
              className="bg-black/20 border-white/10 text-foreground h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="posicao" className="text-muted-foreground">Cargo/Posição</Label>
            <Select 
              value={form.watch("posicao")} 
              onValueChange={(val) => form.setValue("posicao", val)}
            >
              <SelectTrigger className="bg-black/20 border-white/10 text-foreground h-12">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10">
                {Object.entries(positionLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={form.handleSubmit(onSubmit)} className="w-full h-12 font-bold uppercase tracking-wider" disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Alterações"}
        </Button>
      </CardContent>
    </Card>
  );
};
