import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Headphones, Plus, MessageSquare, ArrowLeft } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RequireTeam } from "@/components/RequireTeam";
import { useMeusChamados, useCriarChamado, useChamadoMensagens, useChamadoAnexos, useEnviarMensagem } from "@/hooks/useChamados";
import type { Chamado } from "@/hooks/useChamados";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  aberto: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  em_andamento: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  resolvido: "bg-green-500/20 text-green-400 border-green-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  aberto: "🟡 Aberto",
  em_andamento: "🔵 Em Andamento",
  resolvido: "🟢 Resolvido",
};

const CATEGORIAS = [
  { value: "bug", label: "Bug" },
  { value: "duvida", label: "Dúvida" },
  { value: "sugestao", label: "Sugestão" },
  { value: "outro", label: "Outro" },
];

function ChamadoDetalhe({ chamado, onVoltar }: { chamado: Chamado; onVoltar: () => void }) {
  const { data: mensagens } = useChamadoMensagens(chamado.id);
  const { data: anexos } = useChamadoAnexos(chamado.id);
  const { user } = useAuth();
  const enviarMensagem = useEnviarMensagem();
  const [novaMensagem, setNovaMensagem] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const handleEnviar = async () => {
    if (!novaMensagem.trim()) return;
    try {
      await enviarMensagem.mutateAsync({
        chamadoId: chamado.id,
        mensagem: novaMensagem,
        anexos: files.length > 0 ? files : undefined,
      });
      setNovaMensagem("");
      setFiles([]);
    } catch {
      toast.error("Erro ao enviar mensagem");
    }
  };

  const anexosPorMensagem = (msgId: string) =>
    anexos?.filter((a) => a.mensagem_id === msgId) ?? [];

  return (
    <div>
      <Button variant="ghost" onClick={onVoltar} className="mb-4 text-gray-400 hover:text-white">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <div className="bg-[#0F2440] border border-white/[0.06] rounded-xl p-5 mb-4">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h2 className="text-lg font-bold text-white">{chamado.assunto}</h2>
          <Badge variant="outline" className={STATUS_COLORS[chamado.status]}>
            {STATUS_LABELS[chamado.status]}
          </Badge>
        </div>
        <p className="text-xs text-gray-500">
          Categoria: {chamado.categoria} • Aberto em{" "}
          {format(new Date(chamado.criado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
      </div>

      {/* Chat */}
      <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
        {mensagens?.map((msg) => {
          const isMe = msg.user_id === user?.id && !msg.is_admin;
          const msgAnexos = anexosPorMensagem(msg.id);
          return (
            <div key={msg.id} className={`flex ${msg.is_admin ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  msg.is_admin
                    ? "bg-[#0F2440] border border-white/[0.06] text-gray-300"
                    : "bg-primary/20 border border-primary/30 text-gray-200"
                }`}
              >
                <p className="text-[10px] font-semibold mb-1 text-gray-500">
                  {msg.is_admin ? "Suporte FutGestor" : "Você"} •{" "}
                  {format(new Date(msg.criado_em), "dd/MM HH:mm")}
                </p>
                <p className="text-sm whitespace-pre-wrap">{msg.mensagem}</p>
                {msgAnexos.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {msgAnexos.map((a) => (
                      <a
                        key={a.id}
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={a.url}
                          alt={a.nome_arquivo}
                          className="max-w-[150px] max-h-[100px] rounded border border-white/10 object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input mensagem */}
      {chamado.status !== "resolvido" && (
        <div className="bg-[#0F2440] border border-white/[0.06] rounded-xl p-4">
          <Textarea
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="mb-3 bg-[#0A1628] border-white/10 text-gray-200"
            rows={3}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 3))}
              className="max-w-[200px] text-xs bg-[#0A1628] border-white/10 text-gray-400"
            />
            <Button
              onClick={handleEnviar}
              disabled={enviarMensagem.isPending || !novaMensagem.trim()}
              size="sm"
              className="ml-auto"
            >
              Enviar
            </Button>
          </div>
          {files.length > 0 && (
            <p className="text-[10px] text-gray-500 mt-1">{files.length} arquivo(s) selecionado(s)</p>
          )}
        </div>
      )}
    </div>
  );
}

function NovoChamadoForm({ onSuccess }: { onSuccess: () => void }) {
  const [assunto, setAssunto] = useState("");
  const [categoria, setCategoria] = useState("outro");
  const [descricao, setDescricao] = useState("");
  const criarChamado = useCriarChamado();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assunto.trim() || !descricao.trim()) return;
    try {
      await criarChamado.mutateAsync({ assunto, descricao, categoria });
      toast.success("Chamado criado com sucesso!");
      onSuccess();
    } catch {
      toast.error("Erro ao criar chamado");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs text-gray-500 block mb-1">Assunto *</label>
        <Input
          value={assunto}
          onChange={(e) => setAssunto(e.target.value)}
          placeholder="Descreva o problema em poucas palavras"
          className="bg-[#0A1628] border-white/10 text-gray-200"
          required
        />
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">Categoria</label>
        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger className="bg-[#0A1628] border-white/10 text-gray-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIAS.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">Descrição *</label>
        <Textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descreva o problema em detalhes..."
          className="bg-[#0A1628] border-white/10 text-gray-200"
          rows={5}
          required
        />
      </div>
      <Button type="submit" disabled={criarChamado.isPending} className="w-full">
        {criarChamado.isPending ? "Criando..." : "Criar Chamado"}
      </Button>
    </form>
  );
}

function SuporteContent() {
  const { data: chamados, isLoading } = useMeusChamados();
  const [view, setView] = useState<"lista" | "novo" | "detalhe">("lista");
  const [chamadoSelecionado, setChamadoSelecionado] = useState<Chamado | null>(null);

  if (view === "detalhe" && chamadoSelecionado) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#0A1628]">
          <div className="container py-8 px-4 md:px-6">
            <ChamadoDetalhe
              chamado={chamadoSelecionado}
              onVoltar={() => { setView("lista"); setChamadoSelecionado(null); }}
            />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#0A1628]">
        <div className="container py-8 px-4 md:px-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#D4A84B] uppercase tracking-[3px] mb-2">🎧 Suporte</p>
              <h1 className="text-3xl font-bold text-white">Central de Suporte</h1>
              <p className="text-gray-500 mt-1">Envie dúvidas, bugs ou sugestões</p>
            </div>
            {view === "lista" && (
              <Button onClick={() => setView("novo")} size="sm">
                <Plus className="mr-1 h-4 w-4" /> Novo Chamado
              </Button>
            )}
          </div>

          {view === "novo" ? (
            <Card className="bg-[#0F2440] border-white/[0.06]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Plus className="h-5 w-5" /> Novo Chamado
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setView("lista")} className="text-gray-400">
                    Cancelar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <NovoChamadoForm onSuccess={() => setView("lista")} />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {isLoading ? (
                <p className="text-center text-gray-500 py-8">Carregando...</p>
              ) : chamados && chamados.length > 0 ? (
                chamados.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setChamadoSelecionado(c); setView("detalhe"); }}
                    className="w-full bg-[#0F2440] border border-white/[0.06] rounded-xl p-4 text-left hover:bg-[#122d50] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-white">{c.assunto}</span>
                      <Badge variant="outline" className={STATUS_COLORS[c.status]}>
                        {STATUS_LABELS[c.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <span>{c.categoria}</span>
                      <span>•</span>
                      <span>{format(new Date(c.criado_em), "dd/MM/yyyy")}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-16">
                  <Headphones className="mx-auto mb-4 h-16 w-16 text-gray-600" />
                  <p className="text-gray-500">Nenhum chamado aberto.</p>
                  <Button onClick={() => setView("novo")} className="mt-4" size="sm">
                    <Plus className="mr-1 h-4 w-4" /> Abrir Chamado
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default function SuportePage() {
  return (
    <RequireTeam>
      <SuporteContent />
    </RequireTeam>
  );
}
