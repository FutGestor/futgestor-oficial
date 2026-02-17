import React from "react";
import { UserCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { positionLabels } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
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
            <Label htmlFor="apelido" className="text-muted-foreground">Apelido</Label>
            <Input
              id="apelido"
              value={form.watch("apelido") || ""}
              onChange={(e) => form.setValue("apelido", e.target.value)}
              placeholder="Ex: Tuck, CR7, Neymar..."
              className="bg-black/20 border-white/10 text-foreground h-12"
            />
            <p className="text-[10px] text-zinc-500">Nome exibido no seu cartão de atleta</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-muted-foreground">E-mail</Label>
            <Input
              id="email"
              value={user?.email || ""}
              disabled
              className="bg-black/40 border-white/5 text-muted-foreground h-12"
            />
          </div>
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

        <div className="space-y-4 pt-6 mt-6 border-t border-white/5">
          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Dados Físicos e Bio</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pe_preferido" className="text-muted-foreground text-[10px] uppercase font-bold">Pé Preferido</Label>
              <Select 
                value={form.watch("pe_preferido") || "nao_informado"} 
                onValueChange={(val) => form.setValue("pe_preferido", val === "nao_informado" ? null : val)}
              >
                <SelectTrigger className="bg-black/20 border-white/10 text-foreground h-11">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  <SelectItem value="nao_informado">Não informado</SelectItem>
                  <SelectItem value="destro">Destro</SelectItem>
                  <SelectItem value="canhoto">Canhoto</SelectItem>
                  <SelectItem value="ambos">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="peso_kg" className="text-muted-foreground text-[10px] uppercase font-bold">Peso (kg)</Label>
              <Input
                id="peso_kg"
                type="number"
                step="0.1"
                placeholder="75.0"
                value={form.watch("peso_kg")}
                onChange={(e) => form.setValue("peso_kg", e.target.value)}
                className="bg-black/20 border-white/10 text-foreground h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="altura_cm" className="text-muted-foreground text-[10px] uppercase font-bold">Altura (cm)</Label>
              <Input
                id="altura_cm"
                type="number"
                placeholder="178"
                value={form.watch("altura_cm")}
                onChange={(e) => form.setValue("altura_cm", e.target.value)}
                className="bg-black/20 border-white/10 text-foreground h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_entrada" className="text-muted-foreground text-[10px] uppercase font-bold">Data de Entrada</Label>
              <Input
                id="data_entrada"
                type="date"
                value={form.watch("data_entrada")}
                onChange={(e) => form.setValue("data_entrada", e.target.value)}
                className="bg-black/20 border-white/10 text-foreground h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="text-muted-foreground text-[10px] uppercase font-bold">Bio / Apresentação</Label>
            <textarea
              id="bio"
              maxLength={300}
              placeholder="Fale um pouco sobre você..."
              value={form.watch("bio")}
              onChange={(e) => form.setValue("bio", e.target.value)}
              className="w-full bg-black/20 border border-white/10 text-foreground rounded-md p-3 h-20 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
            />
            <p className="text-[10px] text-zinc-500">{(form.watch("bio") || "").length}/300 caracteres</p>
          </div>
        </div>

        <Button 
          onClick={() => {
            form.handleSubmit(
              onSubmit,
              (errors) => {
                console.error("🔴 Form validation errors:", errors);
                const errorFields = Object.keys(errors).join(", ");
                toast({
                  title: "Campos obrigatórios",
                  description: `Verifique os seguintes campos: ${errorFields}`,
                  variant: "destructive"
                });
              }
            )();
          }}
          className="w-full h-12 font-bold uppercase tracking-wider" 
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Alterações"}
        </Button>
      </CardContent>
    </Card>
  );
};
