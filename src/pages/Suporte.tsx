import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Headphones, Plus, MessageSquare, ArrowLeft, Trash2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RequireTeam } from "@/components/RequireTeam";
import { useMeusChamados, useCriarChamado, useChamadoMensagens, useChamadoAnexos, useEnviarMensagem, useExcluirChamado } from "@/hooks/useChamados";
import type { Chamado } from "@/hooks/useChamados";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STATUS_COLORS: Record<string, string> = {
  aberto: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30",
  em_andamento: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30",
  resolvido: "bg-green-500/10 text-green-600 border-green-500/20 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30",
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
      <Button variant="ghost" onClick={onVoltar} className="mb-4 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <div className="bg-transparent border border-border rounded-xl p-5 mb-4">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h2 className="text-lg font-bold text-foreground">{chamado.assunto}</h2>
          <Badge variant="outline" className={STATUS_COLORS[chamado.status]}>
            {STATUS_LABELS[chamado.status]}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
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
                    ? "bg-muted border border-border text-foreground"
                    : "bg-primary/10 border border-primary/20 text-foreground dark:bg-primary/20 dark:border-primary/30"
                }`}
              >
                <p className="text-[10px] font-semibold mb-1 text-muted-foreground">
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
        <div className="bg-transparent border border-border rounded-xl p-4">
          <Textarea
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="mb-3 bg-transparent border-border text-foreground"
            rows={3}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 3))}
              className="max-w-[200px] text-xs bg-transparent border-border text-muted-foreground"
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
            <p className="text-[10px] text-muted-foreground mt-1">{files.length} arquivo(s) selecionado(s)</p>
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
        <label className="text-xs text-muted-foreground block mb-1">Assunto *</label>
        <Input
          value={assunto}
          onChange={(e) => setAssunto(e.target.value)}
          placeholder="Descreva o problema em poucas palavras"
          className="bg-transparent border-border text-foreground"
          required
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Categoria</label>
        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger className="bg-transparent border-border text-foreground">
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
        <label className="text-xs text-muted-foreground block mb-1">Descrição *</label>
        <Textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descreva o problema em detalhes..."
          className="bg-transparent border-border text-foreground"
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
  const excluirChamado = useExcluirChamado();
  const [view, setView] = useState<"lista" | "novo" | "detalhe">("lista");
  const [chamadoSelecionado, setChamadoSelecionado] = useState<Chamado | null>(null);
  const [chamadoParaExcluir, setChamadoParaExcluir] = useState<string | null>(null);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const chamadoIdParam = queryParams.get("chamado_id");

  // Efeito para auto-navegação via URL
  useEffect(() => {
    if (chamadoIdParam && chamados) {
      const targetChamado = chamados.find(c => c.id === chamadoIdParam);
      if (targetChamado) {
        handleSelecionarChamado(targetChamado);
      }
    }
  }, [chamadoIdParam, chamados]);

  // Função centralizada para selecionar chamado e marcar como lido
  const handleSelecionarChamado = (chamado: Chamado) => {
    setChamadoSelecionado(chamado);
    setView("detalhe");
    
    // Marcar como lido localmente
    const readMap = JSON.parse(localStorage.getItem("futgestor_chamados_read") || "{}");
    readMap[chamado.id] = new Date().toISOString();
    localStorage.setItem("futgestor_chamados_read", JSON.stringify(readMap));
  };

  if (view === "detalhe" && chamadoSelecionado) {
    return (
      <Layout>
        <div className="min-h-screen bg-transparent text-foreground">
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
      <div className="min-h-screen bg-transparent text-foreground">
        <div className="container py-8 px-4 md:px-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#D4A84B] uppercase tracking-[3px] mb-2">🎧 Suporte</p>
              <h1 className="text-3xl font-bold text-foreground">Central de Suporte</h1>
              <p className="text-muted-foreground mt-1">Envie dúvidas, bugs ou sugestões</p>
            </div>
            {view === "lista" && (
              <Button onClick={() => setView("novo")} size="sm">
                <Plus className="mr-1 h-4 w-4" /> Novo Chamado
              </Button>
            )}
          </div>

          {view === "novo" ? (
            <Card className="bg-transparent border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Plus className="h-5 w-5" /> Novo Chamado
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setView("lista")} className="text-muted-foreground">
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
                  <div
                    key={c.id}
                    className="w-full bg-transparent border border-border rounded-xl p-4 hover:bg-muted transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <button
                        onClick={() => handleSelecionarChamado(c)}
                        className="flex-1 text-left"
                      >
                        <span className="text-sm font-semibold text-foreground">{c.assunto}</span>
                      </button>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={STATUS_COLORS[c.status]}>
                          {STATUS_LABELS[c.status]}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setChamadoParaExcluir(c.id);
                          }}
                          title="Excluir chamado"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSelecionarChamado(c)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{c.categoria}</span>
                        <span>•</span>
                        <span>{format(new Date(c.criado_em), "dd/MM/yyyy")}</span>
                      </div>
                    </button>
                  </div>
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

        {/* Diálogo de confirmação para excluir chamado */}
        <AlertDialog open={!!chamadoParaExcluir} onOpenChange={() => setChamadoParaExcluir(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Chamado</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este chamado? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setChamadoParaExcluir(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => {
                  if (chamadoParaExcluir) {
                    try {
                      await excluirChamado.mutateAsync(chamadoParaExcluir);
                      toast.success("Chamado excluído com sucesso!");
                      setChamadoParaExcluir(null);
                    } catch (error: any) {
                      toast.error(error.message || "Erro ao excluir chamado");
                    }
                  }
                }}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
