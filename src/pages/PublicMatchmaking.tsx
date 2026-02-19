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
import { Calendar as CalendarIcon, Star, Shield, Trophy, CheckCircle2, ArrowRight, MessageSquare, Clock, MapPin, Zap, Sword } from "lucide-react";
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
    captcha_answer: "",
  });
  
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [captcha, setCaptcha] = useState(() => ({
    num1: Math.floor(Math.random() * 9) + 1,
    num2: Math.floor(Math.random() * 9) + 1
  }));

  const refreshCaptcha = () => {
    setCaptcha({
      num1: Math.floor(Math.random() * 9) + 1,
      num2: Math.floor(Math.random() * 9) + 1
    });
    setFormData(p => ({ ...p, captcha_answer: "" }));
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

    const expected = captcha.num1 + captcha.num2;
    if (parseInt(formData.captcha_answer) !== expected) {
      toast({
        title: "Captcha incorreto",
        description: `Quanto é ${captcha.num1} + ${captcha.num2}? Tente novamente.`,
        variant: "destructive",
      });
      refreshCaptcha();
      return;
    }

    try {
      if (!team?.id) throw new Error("Time não encontrado");
      
      await createSolicitacao.mutateAsync({
        ...formData,
        data_preferida: format(date, "yyyy-MM-dd"),
        team_id: team.id,
        captcha_answer: expected,
        captcha_expected: expected,
      });
      setSuccess(true);
    } catch (error) {
      refreshCaptcha();
    }
  };

  if (success) {
    return (
      <Layout>
        <div className="flex min-h-[80vh] items-center justify-center p-4">
          <Card className="max-w-md w-full border border-white/10 bg-black/40 backdrop-blur-3xl shadow-2xl relative z-10 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#1B3A5C] to-transparent animate-pulse" />
          
          <CardHeader className="text-center pt-10 pb-4">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-[#1B3A5C] blur-2xl opacity-20 animate-pulse" />
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1B3A5C] to-[#D4A220] flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(27,58,92,0.4)]">
                  <Zap className="w-12 h-12 text-white fill-current animate-bounce" />
                </div>
              </div>
            </div>
            
            <Badge className="mx-auto mb-4 bg-[#1B3A5C]/20 text-[#1B3A5C] border-[#1B3A5C]/30 animate-in fade-in zoom-in duration-500">
              CONQUISTA DESBLOQUEADA
            </Badge>
            
            <CardTitle className="text-3xl font-black text-white uppercase italic tracking-tighter drop-shadow-lg">
              DESAFIO ENVIADO!
            </CardTitle>
            <CardDescription className="text-slate-300 mt-2 px-4">
              Sua convocação chegou ao time do **{team?.nome || "Time"}**. Prepare as chuteiras, entramos em contato em breve!
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pb-10">
            <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 mt-2 shadow-inner">
              <h4 className="font-black text-[#1B3A5C] uppercase italic text-sm mb-2 flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                QUER UM SITE ASSIM PARA O SEU TIME?
              </h4>
              <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                No FutGestor você cria sua página profissional, gerencia elenco, agenda e muito mais. É a elite da gestão esportiva.
              </p>
              <Button 
                onClick={() => window.location.href = '/auth'}
                className="w-full bg-[#1B3A5C] hover:bg-[#D4A220] text-white font-black uppercase italic rounded-xl h-14 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(230,179,37,0.3)] transition-all hover:scale-[1.03] active:scale-[0.97]"
              >
                CRIAR MEU TIME AGORA <CheckCircle2 className="w-5 h-5" />
              </Button>
            </div>
            
            <Button 
              variant="link" 
              onClick={() => setSuccess(false)}
              className="w-full text-slate-500 hover:text-slate-300 text-xs font-bold uppercase tracking-widest"
             >
              Voltar para o Matchmaking
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen font-sans relative">

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
               <div className="flex gap-0.5 text-[#1B3A5C]">
                 <Star className="w-4 h-4 fill-current" />
                 <Star className="w-4 h-4 fill-current" />
                 <Star className="w-4 h-4 fill-current" />
                 <Star className="w-4 h-4 fill-current" />
                 <Star className="w-4 h-4 fill-current" />
               </div>
               <Badge className="bg-[#1B3A5C]/20 text-[#1B3A5C] border-[#1B3A5C]/30 text-[10px] font-black italic">TIMELINE VERIFICADA</Badge>
               <span className="text-xs font-bold text-slate-400 uppercase italic flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-[#1B3A5C]" />
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

            <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-md rounded-3xl p-6 md:p-10 border border-white/10 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5 -mr-8 -mt-8">
                <Trophy className="w-64 h-64 text-white" />
               </div>

               <div className="relative z-10 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase text-[#1B3A5C] italic tracking-[0.2em]">NOME DO TIME VISITANTE</Label>
                     <Input 
                      required
                      placeholder="Ex: Real Madrid FC"
                      value={formData.nome_time}
                      onChange={e => setFormData(p => ({...p, nome_time: e.target.value}))}
                      className="h-12 rounded-xl border-white/10 bg-black/40 text-white placeholder:text-slate-600 focus:border-[#1B3A5C] focus:ring-[#1B3A5C]/20 transition-all font-bold"
                     />
                   </div>
                   <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase text-[#1B3A5C] italic tracking-[0.2em]">WHATSAPP DO RESPONSÁVEL</Label>
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
                     <Label className="text-[10px] font-black uppercase text-[#1B3A5C] italic tracking-[0.2em]">SUGESTÃO DE DATA</Label>
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
                          {date ? format(date, "dd 'de' MMMM", { locale: ptBR }) : <span>Selecione no calendário</span>}
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
                     <Label className="text-[10px] font-black uppercase text-[#1B3A5C] italic tracking-[0.2em]">HORÁRIO DA PARTIDA</Label>
                     <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1B3A5C]" />
                        <Input 
                          required
                          type="time"
                          value={formData.horario_preferido}
                          onChange={e => setFormData(p => ({...p, horario_preferido: e.target.value}))}
                          className="h-12 pl-10 rounded-xl border-white/10 bg-black/40 text-white focus:border-[#1B3A5C] focus:ring-[#1B3A5C]/20 font-bold"
                        />
                     </div>
                   </div>
                 </div>

                 <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase text-[#1B3A5C] italic tracking-[0.2em]">LOCAL SUGERIDO</Label>
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
                   <Label className="text-[10px] font-black uppercase text-[#1B3A5C] italic tracking-[0.2em]">OBSERVAÇÕES ADICIONAIS</Label>
                   <Textarea 
                    placeholder="Conte um pouco sobre o nível do seu time..."
                    value={formData.observacoes}
                    onChange={e => setFormData(p => ({...p, observacoes: e.target.value}))}
                    className="rounded-xl border-white/10 bg-black/40 text-white placeholder:text-slate-600 focus:border-[#1B3A5C] focus:ring-[#1B3A5C]/20 min-h-[120px] font-medium leading-relaxed"
                   />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase text-[#1B3A5C] italic tracking-[0.2em]">DESAFIO HUMANO: QUANTO É {captcha.num1} + {captcha.num2}?</Label>
                      <Input 
                        required
                        type="number"
                        placeholder="Sua resposta"
                        value={formData.captcha_answer}
                        onChange={e => setFormData(p => ({...p, captcha_answer: e.target.value}))}
                        className="h-12 rounded-xl border-white/10 bg-black/40 text-white placeholder:text-slate-600 focus:border-[#1B3A5C] focus:ring-[#1B3A5C]/20 font-bold"
                      />
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

                 <p className="text-[9px] text-center text-slate-500 uppercase font-bold tracking-[0.3em] mt-6">
                    A mais completa gestão esportiva
                 </p>
               </div>
            </form>
          </div>

          <div className="lg:col-span-4 space-y-8">
             {/* Widget: Agenda Real */}
             <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="font-black text-white uppercase italic text-sm border-l-4 border-[#1B3A5C] pl-3">Agenda do Mês</h4>
                  <CalendarIcon className="w-4 h-4 text-[#1B3A5C]" />
                </div>
                
                <div className="space-y-6">
                   {proximosTresJogos.length > 0 ? proximosTresJogos.map((jogo, i) => (
                      <div key={jogo.id} className="flex items-center gap-4 group cursor-help anim-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="w-12 h-12 rounded-2xl bg-black/60 flex flex-col items-center justify-center font-black text-[#1B3A5C] border border-white/10 shadow-inner group-hover:border-[#1B3A5C]/40 transition-colors">
                          <span className="text-xs leading-none">{format(new Date(jogo.data_hora), "dd")}</span>
                          <span className="text-[8px] uppercase tracking-tighter opacity-60 font-bold">{format(new Date(jogo.data_hora), "MMM", { locale: ptBR })}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                           <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">{format(new Date(jogo.data_hora), "EEEE", { locale: ptBR })}</span>
                           <span className="text-xs font-black text-slate-100 uppercase italic truncate block">
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
                        <p className="text-[10px] text-slate-500 font-medium">Nenhum jogo confirmado nos próximos dias.</p>
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
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[#1B3A5C]">
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
</Layout>
  );
}
