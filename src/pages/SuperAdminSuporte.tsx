import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Headphones, ArrowLeft, Search } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useTodosChamados,
  useChamadoMensagens,
  useChamadoAnexos,
  useEnviarMensagem,
  useAtualizarStatusChamado,
} from "@/hooks/useChamados";
import type { Chamado } from "@/hooks/useChamados";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Navigate, useNavigate } from "react-router-dom";

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

function ChamadoAdminDetalhe({ chamado, onVoltar }: { chamado: Chamado; onVoltar: () => void }) {
  const { data: mensagens } = useChamadoMensagens(chamado.id);
  const { data: anexos } = useChamadoAnexos(chamado.id);
  const { user } = useAuth();
  const enviarMensagem = useEnviarMensagem();
  const atualizarStatus = useAtualizarStatusChamado();
  const [novaMensagem, setNovaMensagem] = useState("");

  const handleEnviar = async () => {
    if (!novaMensagem.trim()) return;
    try {
      await enviarMensagem.mutateAsync({
        chamadoId: chamado.id,
        mensagem: novaMensagem,
        isAdmin: true,
      });
      setNovaMensagem("");
      toast.success("Resposta enviada");
    } catch {
      toast.error("Erro ao enviar");
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await atualizarStatus.mutateAsync({ chamadoId: chamado.id, status });
      toast.success("Status atualizado");
    } catch (error: any) {
      toast.error(`Erro ao atualizar status: ${error.message || "Erro desconhecido"}`);
    }
  };

  const anexosPorMensagem = (msgId: string) => anexos?.filter((a) => a.mensagem_id === msgId) ?? [];

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
        <p className="text-xs text-gray-500 mb-3">
          Time: {chamado.team?.nome ?? "—"} • Categoria: {chamado.categoria} •{" "}
          {format(new Date(chamado.criado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
        <div className="flex gap-2">
          {["aberto", "em_andamento", "resolvido"].map((s) => (
            <Button
              key={s}
              size="sm"
              variant={chamado.status === s ? "default" : "outline"}
              onClick={() => handleStatusChange(s)}
              className="text-xs"
            >
              {STATUS_LABELS[s]}
            </Button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
        {mensagens?.map((msg) => {
          const msgAnexos = anexosPorMensagem(msg.id);
          return (
            <div key={msg.id} className={`flex ${msg.is_admin ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${msg.is_admin
                  ? "bg-primary/20 border border-primary/30 text-gray-200"
                  : "bg-[#0F2440] border border-white/[0.06] text-gray-300"
                  }`}
              >
                <p className="text-[10px] font-semibold mb-1 text-gray-500">
                  {msg.is_admin ? "Suporte FutGestor" : "Usuário"} •{" "}
                  {format(new Date(msg.criado_em), "dd/MM HH:mm")}
                </p>
                <p className="text-sm whitespace-pre-wrap">{msg.mensagem}</p>
                {msgAnexos.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {msgAnexos.map((a) => (
                      <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer">
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

      {/* Resposta admin */}
      <div className="bg-[#0F2440] border border-white/[0.06] rounded-xl p-4">
        <Textarea
          value={novaMensagem}
          onChange={(e) => setNovaMensagem(e.target.value)}
          placeholder="Responder ao usuário..."
          className="mb-3 bg-[#0A1628] border-white/10 text-gray-200"
          rows={3}
        />
        <Button onClick={handleEnviar} disabled={enviarMensagem.isPending || !novaMensagem.trim()} size="sm">
          Responder
        </Button>
      </div>
    </div>
  );
}

export default function SuperAdminSuporte() {
  const { isSuperAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: chamados, isLoading } = useTodosChamados();
  const [chamadoSelecionado, setChamadoSelecionado] = useState<Chamado | null>(null);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [busca, setBusca] = useState("");

  if (authLoading) return null;
  if (!isSuperAdmin) return <Navigate to="/" replace />;

  const abertos = chamados?.filter((c) => c.status === "aberto").length ?? 0;
  const emAndamento = chamados?.filter((c) => c.status === "em_andamento").length ?? 0;
  const resolvidos = chamados?.filter((c) => c.status === "resolvido").length ?? 0;

  const filtrados = chamados?.filter((c) => {
    if (filtroStatus !== "todos" && c.status !== filtroStatus) return false;
    if (busca && !c.assunto.toLowerCase().includes(busca.toLowerCase()) && !c.team?.nome?.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  if (chamadoSelecionado) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#0A1628]">
          <div className="container py-8 px-4 md:px-6">
            <ChamadoAdminDetalhe
              chamado={chamadoSelecionado}
              onVoltar={() => setChamadoSelecionado(null)}
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
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#D4A84B] uppercase tracking-[3px] mb-2">🎧 Admin</p>
              <h1 className="text-3xl font-bold text-white">Suporte Global</h1>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/super-admin")}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 w-fit"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Painel Master
            </Button>
          </div>

          {/* Contadores */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Abertos", value: abertos, color: "text-yellow-400" },
              { label: "Em Andamento", value: emAndamento, color: "text-blue-400" },
              { label: "Resolvidos", value: resolvidos, color: "text-green-400" },
            ].map((c) => (
              <div key={c.label} className="bg-[#0F2440] border border-white/[0.06] rounded-xl p-4 text-center">
                <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-3 mb-4">
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-[160px] bg-[#0F2440] border-white/10 text-gray-300">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="aberto">Aberto</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="resolvido">Resolvido</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por assunto ou time..."
                className="pl-9 bg-[#0F2440] border-white/10 text-gray-300"
              />
            </div>
          </div>

          {/* Lista */}
          <div className="space-y-2">
            {isLoading ? (
              <p className="text-center text-gray-500 py-8">Carregando...</p>
            ) : filtrados && filtrados.length > 0 ? (
              filtrados.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setChamadoSelecionado(c)}
                  className="w-full bg-[#0F2440] border border-white/[0.06] rounded-xl p-4 text-left hover:bg-[#122d50] transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-white">{c.assunto}</span>
                    <Badge variant="outline" className={STATUS_COLORS[c.status]}>
                      {STATUS_LABELS[c.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span>{c.team?.nome ?? "—"}</span>
                    <span>•</span>
                    <span>{c.categoria}</span>
                    <span>•</span>
                    <span>{format(new Date(c.criado_em), "dd/MM/yyyy")}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-16">
                <Headphones className="mx-auto mb-4 h-16 w-16 text-gray-600" />
                <p className="text-gray-500">Nenhum chamado encontrado.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
