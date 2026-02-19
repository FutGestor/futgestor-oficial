import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Loader2, Shield, MapPin, CheckCircle2, XCircle, 
  Upload, ChevronRight, ChevronLeft, Flag, Users, 
  Award, Globe, Check 
} from "lucide-react";
import { FutGestorLogo } from "@/components/FutGestorLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTeamConfig } from "@/hooks/useTeamConfig";
import { useSlugCheck } from "@/hooks/useSlugCheck";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ImageCropperModal } from "@/components/ui/ImageCropperModal";
import { LoadingScreen } from "@/components/LoadingScreen";

const onboardingSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  escudo_url: z.string().optional(),
  modalidade: z.string().min(1, "Selecione uma modalidade"),
  faixa_etaria: z.string().min(1, "Selecione a faixa etária"),
  genero: z.string().min(1, "Selecione o gênero"),
  cidade: z.string().min(2, "Cidade obrigatória"),
  uf: z.string().min(2, "UF obrigatório"),
  cep: z.string().regex(/^\d{5}-\d{3}$/, "CEP inválido (00000-000)"),
  slug: z
    .string()
    .min(3, "Slug deve ter pelo menos 3 caracteres")
    .max(50, "Slug muito longo")
    .regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hífens"),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

const steps = [
  { id: 1, title: "Identidade", icon: Shield },
  { id: 2, title: "Classificação", icon: Flag },
  { id: 3, title: "URL e Dados", icon: Globe },
  { id: 4, title: "Tudo Pronto", icon: CheckCircle2 },
];

function generateSlug(nome: string, cidade: string): string {
  const combined = cidade ? `${nome}-${cidade}` : nome;
  return combined
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, refreshProfile, isLoading: authLoading } = useAuth();
  const { team: existingTeam } = useTeamConfig();

  useEffect(() => {
    if (profile?.team_id && existingTeam?.slug) {
      navigate(`/time/${existingTeam.slug}`);
      return;
    }
  }, [profile, existingTeam?.slug, navigate]);

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { 
      nome: "", 
      cidade: "", 
      uf: "",
      cep: "",
      slug: "", 
      modalidade: "society_7",
      faixa_etaria: "livre",
      genero: "masculino",
      escudo_url: ""
    },
    mode: "onChange"
  });

  const currentSlug = form.watch("slug");
  const { isChecking, isAvailable, suggestions } = useSlugCheck(currentSlug);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const fetchCep = async (cep: string) => {
    const rawCep = cep.replace(/\D/g, "");
    if (rawCep.length !== 8) return;

    setIsLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast({ variant: "destructive", title: "Erro", description: "CEP não encontrado." });
        form.setValue("cidade", "");
        form.setValue("uf", "");
        return;
      }

      form.setValue("cidade", data.localidade);
      form.setValue("uf", data.uf);
      form.trigger(["cidade", "uf"]);
      
      // Gerar slug inicial baseado na cidade se ainda estiver vazio
      if (!form.getValues("slug")) {
        form.setValue("slug", generateSlug(form.getValues("nome"), data.localidade));
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao buscar CEP." });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 8);
    if (numbers.length > 5) return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
    return numbers;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Arquivo muito grande", description: "A imagem deve ter no máximo 5MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setTempImage(reader.result as string);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    e.target.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user) return;
    setIsCropModalOpen(false);
    setIsUploading(true);

    try {
      const fileName = `${user.id}_${Date.now()}.jpg`;
      const filePath = `escudos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('escudos')
        .upload(filePath, croppedBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('escudos')
        .getPublicUrl(filePath);

      form.setValue("escudo_url", publicUrl);
      toast({ title: "Escudo carregado!", description: "Seu escudo foi recortado e enviado com sucesso." });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ variant: "destructive", title: "Erro no upload", description: error.message });
    } finally {
      setIsUploading(false);
      setTempImage(null);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof OnboardingFormData)[] = [];
    if (currentStep === 1) fieldsToValidate = ["nome"];
    if (currentStep === 2) fieldsToValidate = ["modalidade", "faixa_etaria", "genero", "cep", "cidade", "uf"];
    if (currentStep === 3) fieldsToValidate = ["slug"];

    const isValid = await form.trigger(fieldsToValidate);
    
    if (isValid) {
      if (currentStep === 3 && isAvailable === false) {
        toast({ variant: "destructive", title: "URL indisponível", description: "Escolha outro slug para seu time." });
        return;
      }
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const onSubmit = async (data: OnboardingFormData) => {
    if (!user) return;
    setIsLoading(true);

    try {
      // 1. Criar Team (SaaS)
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({ 
          nome: data.nome, 
          slug: data.slug,
          escudo_url: data.escudo_url,
          cidade: data.cidade,
          estado: data.uf
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // 2. Atualizar Profile
      await supabase
        .from("profiles")
        .update({ team_id: team.id, aprovado: true })
        .eq("id", user.id);

      // 4. Role Admin
      await supabase
        .from("user_roles")
        .upsert({ user_id: user.id, role: "admin", team_id: team.id });

      // 5. Criar Time (Entidade Esportiva)
      const { error: timeError } = await supabase
        .from("times")
        .insert({
          nome: data.nome,
          cidade: data.cidade,
          uf: data.uf,
          cep: data.cep,
          modalidade: data.modalidade,
          faixa_etaria: data.faixa_etaria,
          genero: data.genero,
          escudo_url: data.escudo_url,
          is_casa: true,
          ativo: true,
          team_id: team.id,
        });

      if (timeError) throw timeError;

      await refreshProfile();
      toast({ title: "Tudo pronto!", description: "Seu time foi criado com sucesso. Iniciando dashboard..." });
      navigate(`/time/${data.slug}`);
    } catch (err: any) {
      console.error("Onboarding error:", err);
      toast({ variant: "destructive", title: "Erro ao criar time", description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex min-h-screen items-center justify-center p-4 py-20">
        <div className="w-full max-w-2xl space-y-8">
          {/* Progress Bar */}
          <div className="relative flex justify-between items-center px-4">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2 -z-10" />
            <div 
              className="absolute top-1/2 left-0 h-0.5 bg-primary transition-all duration-500 ease-in-out -translate-y-1/2 -z-10" 
              style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
            />
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              
              return (
                <div key={step.id} className="flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                    isActive ? "bg-primary border-primary text-white scale-110 shadow-[0_0_15px_rgba(212,168,75,0.4)]" : 
                    isCompleted ? "bg-green-500 border-green-500 text-white" : 
                    "bg-zinc-900 border-white/10 text-zinc-500"
                  )}>
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest hidden sm:block",
                    isActive ? "text-white" : "text-zinc-500"
                  )}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>

          <Card className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 scale-75">
                <FutGestorLogo className="h-16 w-16" />
              </div>
              <CardTitle className="text-2xl font-black uppercase italic tracking-tighter">
                {steps[currentStep - 1].title}
              </CardTitle>
              <CardDescription className="uppercase text-[10px] font-bold tracking-[0.2em] text-primary/70">
                Etapa {currentStep} de 4
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-1 flex flex-col justify-between">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="flex-1"
                    >
                      {currentStep === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                          <div className="flex flex-col items-center gap-6">
                            <div className="relative group">
                              <Avatar className="h-32 w-32 border-4 border-white/5 ring-4 ring-black/50 overflow-hidden bg-zinc-900">
                                {form.watch("escudo_url") ? (
                                  <AvatarImage src={form.watch("escudo_url")} className="object-cover" />
                                ) : (
                                  <AvatarFallback className="text-zinc-500">
                                    <Shield className="h-12 w-12" />
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <label htmlFor="logo-upload" className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                                {isUploading ? <Loader2 className="h-6 w-6 animate-spin text-white" /> : <Upload className="h-6 w-6 text-white" />}
                                <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                              </label>
                            </div>
                            <div className="text-center space-y-1">
                              <h4 className="text-white font-bold">Escudo do Time</h4>
                              <p className="text-xs text-zinc-500">Clique para fazer upload (opcional)</p>
                            </div>
                          </div>

                          <FormField
                            control={form.control}
                            name="nome"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-black uppercase text-zinc-400">Nome do Time</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Shield className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                    <Input 
                                      placeholder="Ex: FC Unidos da Vila" 
                                      className="bg-zinc-900/50 border-white/5 pl-10 h-12"
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(e.target.value);
                                        if (form.getValues("cidade")) {
                                          form.setValue("slug", generateSlug(e.target.value, form.getValues("cidade")));
                                        }
                                      }}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {currentStep === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="modalidade"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-black uppercase text-zinc-400">Modalidade</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="bg-zinc-900/50 border-white/5 h-12">
                                        <SelectValue placeholder="Selecione" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                      <SelectItem value="society_7">Society (7x7)</SelectItem>
                                      <SelectItem value="campo_11">Campo (11x11)</SelectItem>
                                      <SelectItem value="futsal">Futsal</SelectItem>
                                      <SelectItem value="areia">Futebol de Areia</SelectItem>
                                      <SelectItem value="outro">Outra</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="faixa_etaria"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-black uppercase text-zinc-400">Faixa Etária</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="bg-zinc-900/50 border-white/5 h-12">
                                        <SelectValue placeholder="Selecione" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                      <SelectItem value="livre">Livre / Aberto</SelectItem>
                                      <SelectItem value="base">Base (Sub-20)</SelectItem>
                                      <SelectItem value="master">Master (35+)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="genero"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-black uppercase text-zinc-400">Gênero</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="bg-zinc-900/50 border-white/5 h-12">
                                        <SelectValue placeholder="Selecione" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                      <SelectItem value="masculino">Masculino</SelectItem>
                                      <SelectItem value="feminino">Feminino</SelectItem>
                                      <SelectItem value="misto">Misto</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="cep"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-black uppercase text-zinc-400">CEP</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
                                      <Input 
                                        placeholder="00000-000" 
                                        className="bg-zinc-900/50 border-white/5 pl-10 h-12"
                                        {...field}
                                        onChange={(e) => {
                                          const formatted = formatCep(e.target.value);
                                          field.onChange(formatted);
                                          if (formatted.length === 9) fetchCep(formatted);
                                          if (formatted.length === 0) {
                                            form.setValue("cidade", "");
                                            form.setValue("uf", "");
                                          }
                                        }}
                                      />
                                      {isLoading && <Loader2 className="absolute right-3 top-3.5 h-4 w-4 animate-spin text-primary" />}
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="cidade"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-black uppercase text-zinc-400">Cidade</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      readOnly 
                                      className="bg-zinc-900/30 border-white/5 text-zinc-500 h-12" 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="uf"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-black uppercase text-zinc-400">UF</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      readOnly 
                                      className="bg-zinc-900/30 border-white/5 text-zinc-500 h-12" 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      )}

                      {currentStep === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                          <FormField
                            control={form.control}
                            name="slug"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-black uppercase text-zinc-400">URL do Time</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Globe className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
                                    <Input 
                                        placeholder="url-do-seu-time" 
                                        className="bg-zinc-900/50 border-white/5 pl-10 h-12"
                                        {...field} 
                                    />
                                    {currentSlug.length >= 3 && (
                                      <div className="absolute right-3 top-3.5">
                                        {isChecking ? <Loader2 className="h-5 w-5 animate-spin text-zinc-500" /> : 
                                         isAvailable ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : 
                                         <XCircle className="h-5 w-5 text-destructive" />}
                                      </div>
                                    )}
                                  </div>
                                </FormControl>
                                <FormDescription className="text-[10px] text-zinc-500">
                                  futgestor.app/time/{field.value || "..."}
                                </FormDescription>
                                {isAvailable === false && suggestions.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {suggestions.map(s => (
                                            <Badge key={s} variant="secondary" className="cursor-pointer" onClick={() => form.setValue("slug", s)}>{s}</Badge>
                                        ))}
                                    </div>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {currentStep === 4 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 flex flex-col items-center gap-6">
                            <Avatar className="h-24 w-24 border-2 border-primary/20 bg-black">
                                <AvatarImage src={form.getValues("escudo_url")} />
                                <AvatarFallback className="bg-zinc-800 text-zinc-500"><Shield className="h-10 w-10" /></AvatarFallback>
                            </Avatar>
                            <div className="text-center space-y-1">
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                                    {form.getValues("nome")}
                                </h3>
                                <div className="flex flex-wrap justify-center gap-3">
                                    <Badge variant="outline" className="border-white/10 text-zinc-400 uppercase text-[9px]">
                                        <MapPin className="h-3 w-3 mr-1" /> {form.getValues("cidade")}
                                    </Badge>
                                    <Badge variant="outline" className="border-white/10 text-zinc-400 uppercase text-[9px]">
                                        <Award className="h-3 w-3 mr-1" /> {form.getValues("modalidade")}
                                    </Badge>
                                </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 p-4 bg-primary/10 border border-primary/20 rounded-xl">
                            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                <Check className="h-6 w-6" />
                            </div>
                            <div>
                                <h5 className="text-white font-bold text-sm">Pronto para o Jogo!</h5>
                                <p className="text-zinc-400 text-xs">Revise os dados e clique em concluir.</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Navigation Footer */}
                  <div className="flex items-center justify-between pt-8 border-t border-white/5 mt-auto">
                    {currentStep > 1 ? (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={prevStep}
                        className="text-zinc-500 hover:text-white"
                        disabled={isLoading}
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" /> Voltar
                      </Button>
                    ) : <div />}

                    {currentStep < 4 ? (
                      <Button 
                        type="button" 
                        onClick={nextStep}
                        className="bg-primary hover:bg-primary/90 text-white font-black uppercase px-8 h-12"
                      >
                        Próximo <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <Button 
                        type="submit"
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-500 text-white font-black uppercase px-8 h-12 shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all hover:scale-105"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Criar Meu Time 🚀"}
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {tempImage && (
            <ImageCropperModal
              image={tempImage}
              isOpen={isCropModalOpen}
              onClose={() => {
                setIsCropModalOpen(false);
                setTempImage(null);
              }}
              onCropComplete={handleCropComplete}
              aspect={1}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
