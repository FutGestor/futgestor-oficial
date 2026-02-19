import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Star, Shield, Trophy, CheckCircle2, ArrowRight, MessageSquare, Clock, MapPin, Zap, Sword, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { TeamShield } from "@/components/TeamShield";
import { useCreateSolicitacao } from "@/hooks/useSolicitacoes";
import { useToast } from "@/hooks/use-toast";
import { useJogosFuturos } from "@/hooks/useData";
import { useMemo, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTeamConfig } from "@/hooks/useTeamConfig";

export default function PublicMatchmaking() {
  const { team, slug } = useTeamSlug();
  const [date, setDate] = useState<Date>();
  const [success, setSuccess] = useState(false);
  const createSolicitacao = useCreateSolicitacao();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { team: myTeam } = useTeamConfig();

  const [formData, setFormData] = useState({
    nome_time: "",
    telefone_contato: "",
    horario_preferido: "20:00",
    local_sugerido: "",
    observacoes: "",
    cep: "",
  });
  
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [cepValido, setCepValido] = useState(false);
  const [cepBuscando, setCepBuscando] = useState(false);

  // Horários disponíveis (de 30 em 30 minutos)
  const horariosDisponiveis = useMemo(() => {
    const horarios = [];
    for (let h = 6; h <= 23; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hora = h.toString().padStart(2, '0');
        const minuto = m.toString().padStart(2, '0');
        horarios.push(`${hora}:${minuto}`);
      }
    }
    return horarios;
  }, []);

  // Validar CEP
  const validarCEP = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      setCepValido(false);
      return;
    }
    
    setCepBuscando(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        setCepValido(false);
        toast({
          title: "CEP inválido",
          description: "O CEP informado não foi encontrado.",
          variant: "destructive",
        });
      } else {
        setCepValido(true);
        // Preenche o local sugerido com a cidade/UF do CEP se estiver vazio
        if (!formData.local_sugerido) {
          setFormData(p => ({ 
            ...p, 
            local_sugerido: `${data.localidade} - ${data.uf}`
          }));
        }
      }
    } catch {
      setCepValido(false);
    } finally {
      setCepBuscando(false);
    }
  };

  useEffect(() => {
    if (myTeam?.nome && myTeam.nome !== "FutGestor") {
      setFormData(prev => ({ ...prev, nome_time: myTeam.nome }));
    }
  }, [myTeam?.nome]);

  const { data: jogosFuturos } = useJogosFuturos(team.id);

  const datasOcupadas = useMemo(() => {
    if (!jogosFuturos) return [];
    return jogosFuturos.map(jogo => new Date(jogo.data_hora));
  }, [jogosFuturos]);

  const proximosTresJogos = useMemo(() => {
    if (!jogosFuturos) return [];
    return [...jogosFuturos]
      .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime())
      .slice(0, 3);
  }, [jogosFuturos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, selecione uma data para o jogo.",
        variant: "destructive",
      });
      return;
    }

    // Validar CEP
    const cepLimpo = formData.cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8 || !cepValido) {
      toast({
        title: "CEP inválido",
        description: "Por favor, informe um CEP válido para continuar.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!team?.id) throw new Error("Time não encontrado");
      
      await createSolicitacao.mutateAsync({
        nome_time: formData.nome_time,
        telefone_contato: formData.telefone_contato,
        horario_preferido: formData.horario_preferido,
        local_sugerido: formData.local_sugerido,
        observacoes: formData.observacoes,
        data_preferida: format(date, "yyyy-MM-dd"),
        team_id: team.id,
      });
      setSuccess(true);
    } catch (error) {
      // Erro já tratado pelo hook
    }
  };

  if (success) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=1920&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
          {/* Dark overlay for stadium */}
          <div className="absolute inset-0 bg-black/60" />
          
          {/* Stadium lights effect */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-[150px]" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-[150px]" />
          
          <Card className="max-w-md w-full border border-white/20 bg-white/10 backdrop-blur-xl shadow-[0_0_60px_rgba(0,0,0,0.5)] relative z-10 overflow-hidden rounded-3xl">
            {/* Glow border effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/20 to-transparent opacity-50" />
            
            <CardHeader className="text-center pt-12 pb-6 relative">
              {/* Lightning bolt with pulse animation */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  {/* Glow behind lightning */}
                  <div className="absolute inset-0 bg-yellow-400 blur-[40px] opacity-60 animate-pulse" />
                  <Zap className="w-24 h-24 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] relative z-10 animate-pulse" strokeWidth={1.5} />
                </div>
              </div>
              
              {/* Badge */}
              <div className="flex justify-center mb-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-yellow-600/80 to-yellow-500/80 border border-yellow-400/50">
                  <span className="text-yellow-100 text-xs font-black uppercase tracking-wider">Conquista Desbloqueada</span>
                </div>
              </div>
              
              <CardTitle className="text-4xl font-black text-white uppercase italic tracking-tight mb-3 drop-shadow-lg text-center">
                DESAFIO ENVIADO!
              </CardTitle>
              
              <p className="text-white/80 text-sm font-medium text-center leading-relaxed">
                Sua convocação chegou ao time do <strong className="text-white">{team?.nome || "Time"}</strong>.<br />
                Prepare as chuteiras, entramos em contato em breve!
              </p>
            </CardHeader>

            <CardContent className="pb-10 px-6">
              {/* CTA Card - Golden style */}
              <div className="relative group">
                {/* Golden glow border */}
                <div className="absolute -inset-[1px] bg-gradient-to-b from-yellow-400/60 via-yellow-600/40 to-yellow-400/60 rounded-2xl blur-sm" />
                
                <div className="relative bg-gradient-to-b from-slate-800/90 to-slate-900/90 p-6 rounded-2xl border border-yellow-400/30">
                  {/* Trophy icon and title */}
                  <div className="flex flex-col items-center text-center mb-4">
                    <span className="text-2xl">🏆</span>
                    <h4 className="font-black text-yellow-400 uppercase italic text-base tracking-wide mt-2 text-center">
                      QUER UM SITE ASSIM PARA O SEU TIME?
                    </h4>
                  </div>
                  
                  <p className="text-sm text-white/70 mb-6 leading-relaxed text-center">
                    No FutGestor você cria sua página profissional, gerencia elenco, agenda e muito mais. É a elite da gestão esportiva.
                  </p>
                  
                  {/* Blue CTA Button */}
                  <Button 
                    onClick={() => window.location.href = '/auth'}
                    className="w-full bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white font-black uppercase text-lg rounded-xl h-14 shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(59,130,246,0.7)] border border-blue-400/50"
                  >
                    CRIAR MEU TIME AGORA
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
              
              {/* Secondary action */}
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setSuccess(false);
                    setDate(undefined);
                    setFormData({
                      nome_time: myTeam?.nome || "",
                      telefone_contato: "",
                      horario_preferido: "20:00",
                      local_sugerido: "",
                      observacoes: "",
                      cep: "",
                    });
                    setCepValido(false);
                    setTimeout(() => window.scrollTo(0, 0), 50);
                  }}
                  className="text-white/50 hover:text-white/80 text-sm font-bold uppercase tracking-widest transition-colors bg-transparent border-0 cursor-pointer"
                >
                  ← VOLTAR PARA O MATCHMAKING
                </button>
              </div>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans relative bg-[#0a0f1a]">

      {/* Hero / Banner Area */}
      <div className="relative h-64 md:h-80 overflow-hidden bg-black/40 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        {team.banner_url && (
          <img src={team.banner_url} className="w-full h-full object-cover opacity-60" alt="" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        <div className="absolute top-4 left-4 z-20">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/10 gap-2 font-bold uppercase italic text-xs"
          >
            <ArrowRight className="w-4 h-4 rotate-180" /> Voltar
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-32 relative z-10 pb-20">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-12">
          <div className="w-36 h-36 md:w-48 md:h-48 rounded-3xl bg-white/5 backdrop-blur-xl shadow-2xl p-4 flex items-center justify-center border-2 border-white/10 group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1B3A5C]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
             <TeamShield 
               escudoUrl={team.escudo_url} 
               teamName={team.nome} 
               size="2xl"
               className="h-full w-full border-0 shadow-none bg-transparent relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-transform group-hover:scale-110"
             />
          </div>
          <div className="text-center md:text-left pb-4 flex-1">
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none mb-3">
              {team.nome}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
               <div className="flex gap-0.5 text-yellow-500">
                 <Star className="w-4 h-4 fill-current" />
                 <Star className="w-4 h-4 fill-current" />
                 <Star className="w-4 h-4 fill-current" />
                 <Star className="w-4 h-4 fill-current" />
                 <Star className="w-4 h-4 fill-current" />
               </div>
               <Badge className="bg-white/10 text-white border-white/20 text-[10px] font-black italic">TIMELINE VERIFICADA</Badge>
               <span className="text-xs font-bold text-white uppercase italic flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-white" />
                {team.cidade}, {team.estado}
               </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tight flex items-center gap-3">
                <div className="p-2 bg-[#1B3A5C] rounded-lg">
                  <Sword className="w-6 h-6 text-white" />
                </div>
                DESAFIE O {team.nome}
              </h2>
              <p className="text-slate-300 max-w-2xl text-sm md:text-base leading-relaxed font-medium">
                Seu esquadrão está pronto para o confronto? Envie sua proposta de jogo agora. Nossa comissão técnica analisará seu desafio e retornará via WhatsApp.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-black/70 backdrop-blur-md rounded-3xl p-6 md:p-10 border border-white/10 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5 -mr-8 -mt-8">
                <Trophy className="w-64 h-64 text-white" />
               </div>

               <div className="relative z-10 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase text-white italic tracking-[0.2em]">NOME DO TIME VISITANTE</Label>
                     <Input 
                      required
                      placeholder="Ex: Real Madrid FC"
                      value={formData.nome_time}
                      onChange={e => setFormData(p => ({...p, nome_time: e.target.value}))}
                      className="h-12 rounded-xl border-white/10 bg-black/40 text-white placeholder:text-slate-600 focus:border-[#1B3A5C] focus:ring-[#1B3A5C]/20 transition-all font-bold"
                     />
                   </div>
                   <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase text-white italic tracking-[0.2em]">WHATSAPP DO RESPONSÁVEL</Label>
                     <Input 
                      required
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={formData.telefone_contato}
                      onChange={e => setFormData(p => ({...p, telefone_contato: e.target.value}))}
                      className="h-12 rounded-xl border-white/10 bg-black/40 text-white placeholder:text-slate-600 focus:border-[#1B3A5C] focus:ring-[#1B3A5C]/20 transition-all font-bold"
                     />
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase text-white italic tracking-[0.2em]">SUGESTÃO DE DATA</Label>
                     <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full h-12 justify-start text-left font-bold rounded-xl border-white/10 bg-black/40",
                            !date ? "text-slate-600" : "text-white hover:text-white"
                          )}
                        >
                          <CalendarIcon className="mr-3 h-4 w-4 text-[#1B3A5C]" />
                          {date ? format(date, "dd 'de' MMMM", { locale: ptBR }) : <span className="text-slate-400">Selecione no calendário</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-2xl border-white/10 shadow-2xl" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(d) => {
                            setDate(d);
                            setCalendarOpen(false);
                          }}
                          disabled={(d) => d < new Date()}
                          modifiers={{ occupied: datasOcupadas }}
                          modifiersStyles={{
                            occupied: { borderBottom: "4px solid #ef4444", borderRadius: "50%" }
                          }}
                          locale={ptBR}
                          initialFocus
                          className="bg-black text-white p-4"
                        />
                        <div className="bg-black/95 p-3 border-t border-white/10 flex items-center gap-3 text-[10px] font-bold uppercase italic text-slate-400">
                          <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239, 68, 68, 0.4)]" />
                          <span>Dias com jogos confirmados</span>
                        </div>
                      </PopoverContent>
                    </Popover>
                   </div>
                   <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase text-white italic tracking-[0.2em]">HORÁRIO DA PARTIDA</Label>
                     <Select 
                       value={formData.horario_preferido}
                       onValueChange={(value) => setFormData(p => ({...p, horario_preferido: value}))}
                     >
                       <SelectTrigger className="h-12 rounded-xl border-white/10 bg-black/40 text-white focus:border-[#1B3A5C] focus:ring-[#1B3A5C]/20 font-bold">
                         <div className="flex items-center gap-2">
                           <Clock className="h-4 w-4 text-white" />
                           <SelectValue placeholder="Selecione o horário" />
                         </div>
                       </SelectTrigger>
                       <SelectContent className="bg-black border-white/10 max-h-[200px]">
                         {horariosDisponiveis.map((horario) => (
                           <SelectItem 
                             key={horario} 
                             value={horario}
                             className="text-white hover:bg-white/10 focus:bg-white/10"
                           >
                             {horario}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                 </div>

                 <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase text-white italic tracking-[0.2em]">LOCAL SUGERIDO</Label>
                   <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1B3A5C]" />
                      <Input 
                        required
                        placeholder="Ex: Arena Principal do Bairro"
                        value={formData.local_sugerido}
                        onChange={e => setFormData(p => ({...p, local_sugerido: e.target.value}))}
                        className="h-12 pl-10 rounded-xl border-white/10 bg-black/40 text-white placeholder:text-slate-600 focus:border-[#1B3A5C] focus:ring-[#1B3A5C]/20 font-bold"
                      />
                   </div>
                 </div>

                 <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase text-white italic tracking-[0.2em]">OBSERVAÇÕES ADICIONAIS</Label>
                   <Textarea 
                    placeholder="Conte um pouco sobre o nível do seu time..."
                    value={formData.observacoes}
                    onChange={e => setFormData(p => ({...p, observacoes: e.target.value}))}
                    className="rounded-xl border-white/10 bg-black/40 text-white placeholder:text-slate-600 focus:border-[#1B3A5C] focus:ring-[#1B3A5C]/20 min-h-[120px] font-medium leading-relaxed"
                   />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase text-white italic tracking-[0.2em]">
                        CEP DO LOCAL {cepValido && <Check className="w-4 h-4 text-green-500 inline ml-1" />}
                      </Label>
                      <div className="relative">
                        <Input 
                          required
                          placeholder="00000-000"
                          value={formData.cep}
                          onChange={e => {
                            const valor = e.target.value.replace(/\D/g, '').slice(0, 8);
                            const formatado = valor.length > 5 ? `${valor.slice(0, 5)}-${valor.slice(5)}` : valor;
                            setFormData(p => ({...p, cep: formatado}));
                            if (valor.length === 8) {
                              validarCEP(formatado);
                            } else {
                              setCepValido(false);
                            }
                          }}
                          className={cn(
                            "h-12 rounded-xl border-white/10 bg-black/40 text-white placeholder:text-slate-600 focus:border-[#1B3A5C] focus:ring-[#1B3A5C]/20 font-bold pr-10",
                            cepValido && "border-green-500/50 focus:border-green-500",
                            !cepValido && formData.cep.length === 9 && "border-red-500/50 focus:border-red-500"
                          )}
                        />
                        {cepBuscando && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-white/50">
                        Informe o CEP do local onde será realizado o jogo
                      </p>
                    </div>

                    <Button 
                      type="submit"
                      disabled={createSolicitacao.isPending}
                      className="w-full bg-[#1B3A5C] hover:bg-[#D4A220] text-white font-black italic rounded-xl h-14 text-lg shadow-[0_0_30px_rgba(230,179,37,0.2)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 group/btn overflow-hidden"
                    >
                      {createSolicitacao.isPending ? (
                        "ENVIANDO DESAFIO..." 
                      ) : (
                        <span className="flex items-center gap-2">
                          ENVIAR MEU DESAFIO <Sword className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </Button>
                  </div>

                 <p className="text-[9px] text-center text-white/60 uppercase font-bold tracking-[0.3em] mt-6">
                    A mais completa gestão esportiva
                 </p>
               </div>
            </form>
          </div>

          <div className="lg:col-span-4 space-y-8">
             {/* Widget: Agenda Real */}
             <div className="bg-black/70 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="font-black text-white uppercase italic text-sm border-l-4 border-white pl-3">Agenda do Mês</h4>
                  <CalendarIcon className="w-4 h-4 text-white" />
                </div>
                
                <div className="space-y-6">
                   {proximosTresJogos.length > 0 ? proximosTresJogos.map((jogo, i) => (
                      <div key={jogo.id} className="flex items-center gap-4 group cursor-help anim-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="w-12 h-12 rounded-2xl bg-black/80 flex flex-col items-center justify-center font-black text-white border border-white/20 shadow-inner group-hover:border-white/40 transition-colors">
                          <span className="text-xs leading-none">{format(new Date(jogo.data_hora), "dd")}</span>
                          <span className="text-[8px] uppercase tracking-tighter opacity-60 font-bold">{format(new Date(jogo.data_hora), "MMM", { locale: ptBR })}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                           <span className="block text-[10px] font-bold text-white/70 uppercase tracking-widest">{format(new Date(jogo.data_hora), "EEEE", { locale: ptBR })}</span>
                           <span className="text-xs font-black text-white uppercase italic truncate block">
                             VS {jogo.time_adversario?.nome || "ADVERSÁRIO"}
                           </span>
                        </div>
                      </div>
                   )) : (
                     <div className="py-10 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-8 h-8 text-green-500 opacity-40" />
                        </div>
                        <p className="text-xs font-black text-green-500 uppercase italic tracking-widest">AGENDA LIVRE</p>
                        <p className="text-[10px] text-white/70 font-medium">Nenhum jogo confirmado nos próximos dias.</p>
                     </div>
                   )}
                </div>
             </div>

             {/* Widget: WhatsApp Admin */}
             <div 
               onClick={() => {
                 const whatsapp = team.owner_contact || team.redes_sociais?.whatsapp;
                 if (whatsapp) {
                   const phone = whatsapp.replace(/\D/g, '');
                   window.open(`https://wa.me/55${phone}?text=Olá,%20vi%20o%20perfil%20do%20${team.nome}%20no%20FutGestor%20e%20gostaria%20de%20falar%20sobre%20um%20desafio.`, '_blank');
                 } else {
                   toast({ title: "Ops!", description: "Este time ainda não configurou um contato oficial." });
                 }
               }}
               className="bg-gradient-to-br from-slate-900 to-black rounded-3xl p-8 text-white border border-white/10 overflow-hidden relative group cursor-pointer hover:border-[#1B3A5C]/30 transition-all shadow-2xl"
             >
                <div className="relative z-10">
                   <div className="w-12 h-12 rounded-2xl bg-[#1B3A5C] flex items-center justify-center mb-6 shadow-lg shadow-[#1B3A5C]/20 group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-6 h-6 text-white" />
                   </div>
                   <h4 className="font-black uppercase italic text-sm mb-3 tracking-tight">Falar com o Responsável</h4>
                   <p className="text-[10px] text-slate-400 font-medium leading-relaxed mb-6">
                      Dúvidas sobre o local, nível do jogo ou coordenação? Resolva agora pelo WhatsApp.
                   </p>
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase text-white">
                      Abrir Conversa <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                   </div>
                </div>
                <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-all group-hover:scale-110">
                   <Shield className="w-32 h-32" />
                </div>
             </div>
        </div>
      </div>
    </div>
    </div>
  );
}
