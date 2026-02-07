import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2, CheckCircle } from "lucide-react";
import { useJogosFuturos } from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCreateSolicitacao } from "@/hooks/useSolicitacoes";

const solicitacaoSchema = z.object({
  nome_time: z
    .string()
    .min(2, "Nome do time deve ter pelo menos 2 caracteres")
    .max(100, "Nome muito longo"),
  email_contato: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  telefone_contato: z
    .string()
    .min(10, "Telefone deve ter pelo menos 10 dígitos")
    .max(20, "Telefone muito longo"),
  data_preferida: z.date({ required_error: "Selecione uma data" }),
  horario_preferido: z.string().min(1, "Selecione um horário"),
  local_sugerido: z
    .string()
    .min(2, "Local deve ter pelo menos 2 caracteres")
    .max(200, "Local muito longo"),
  observacoes: z.string().max(500, "Máximo 500 caracteres").optional(),
});

type SolicitacaoFormData = z.infer<typeof solicitacaoSchema>;

const horarios = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
];

interface SolicitacaoJogoFormProps {
  teamId?: string;
  onSuccess?: () => void;
}

export function SolicitacaoJogoForm({ teamId, onSuccess }: SolicitacaoJogoFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const createSolicitacao = useCreateSolicitacao();
  const { data: jogosFuturos } = useJogosFuturos();

  // Extrair datas dos jogos futuros para marcar no calendário
  const datasOcupadas = useMemo(() => {
    if (!jogosFuturos) return [];
    return jogosFuturos.map(jogo => {
      const date = new Date(jogo.data_hora);
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    });
  }, [jogosFuturos]);

  const form = useForm<SolicitacaoFormData>({
    resolver: zodResolver(solicitacaoSchema),
    defaultValues: {
      nome_time: "",
      email_contato: "",
      telefone_contato: "",
      local_sugerido: "",
      observacoes: "",
    },
  });

  const onSubmit = async (data: SolicitacaoFormData) => {
    await createSolicitacao.mutateAsync({
      nome_time: data.nome_time,
      email_contato: data.email_contato || undefined,
      telefone_contato: data.telefone_contato,
      data_preferida: format(data.data_preferida, "yyyy-MM-dd"),
      horario_preferido: data.horario_preferido,
      local_sugerido: data.local_sugerido,
      observacoes: data.observacoes,
      team_id: teamId,
    });
    setSubmitted(true);
    onSuccess?.();
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircle className="mb-4 h-16 w-16 text-green-500" />
        <h3 className="mb-2 text-xl font-semibold">Solicitação Enviada!</h3>
        <p className="text-muted-foreground">
          Recebemos sua proposta de jogo. Entraremos em contato em breve pelo
          telefone informado.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Time *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Amigos do Bairro FC" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="telefone_contato"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone de Contato *</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 99999-9999" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email_contato"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="contato@seutime.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="data_preferida"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data Preferida *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      modifiers={{ occupied: datasOcupadas }}
                      modifiersStyles={{
                        occupied: { 
                          backgroundColor: "rgba(239, 68, 68, 0.2)",
                          borderRadius: "50%",
                          fontWeight: "bold"
                        },
                      }}
                      locale={ptBR}
                      initialFocus
                      className="pointer-events-auto"
                    />
                    <div className="border-t px-3 py-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-3 w-3 rounded-full bg-red-500/20"></span>
                        <span>Dias com jogos agendados</span>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="horario_preferido"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário Preferido *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um horário" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {horarios.map((hora) => (
                      <SelectItem key={hora} value={hora}>
                        {hora}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="local_sugerido"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Local Sugerido *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Arena Society - Rua das Flores, 123"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Alguma informação adicional..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={createSolicitacao.isPending}
        >
          {createSolicitacao.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            "Enviar Solicitação"
          )}
        </Button>
      </form>
    </Form>
  );
}
