import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, ArrowLeft, Trash2, Filter, AlertCircle, RefreshCw } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import {
  useNotificacoes,
  useNotificacoesNaoLidas,
  useMarcarNotificacaoLida,
  useMarcarTodasLidas,
  getNotificationIcon,
  Notificacao,
} from "@/hooks/useNotificacoes";

export default function Notificacoes() {
  const navigate = useNavigate();
  const { basePath } = useTeamSlug();
  const [filtro, setFiltro] = useState<"todas" | "nao-lidas" | "lidas">("todas");

  const { data: notificacoes = [], isLoading, error, refetch } = useNotificacoes();
  const { data: naoLidas = 0 } = useNotificacoesNaoLidas();
  const marcarLida = useMarcarNotificacaoLida();
  const marcarTodasLidas = useMarcarTodasLidas();

  const notificacoesFiltradas = notificacoes.filter((n) => {
    if (filtro === "nao-lidas") return !n.lida;
    if (filtro === "lidas") return n.lida;
    return true;
  });

  const handleClick = (notificacao: Notificacao) => {
    if (!notificacao.lida) {
      marcarLida.mutate(notificacao.id);
    }
    if (notificacao.link) {
      let path = notificacao.link.replace(/\/+/g, "/");
      if (!path.startsWith("/")) path = `/${path}`;
      navigate(path);
    }
  };

  const handleMarcarTodasLidas = () => {
    marcarTodasLidas.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f172a] to-[#1a1a2e] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`${basePath}/meu-perfil`)}
                className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">
                  Notificações
                </h1>
                <p className="text-sm text-white/50">
                  {naoLidas > 0
                    ? `${naoLidas} não ${naoLidas === 1 ? "lida" : "lidas"}`
                    : "Todas lidas"}
                </p>
              </div>
            </div>

            {naoLidas > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarcarTodasLidas}
                disabled={marcarTodasLidas.isPending}
                className="text-primary hover:text-primary hover:bg-primary/10 gap-2"
              >
                <Check className="h-4 w-4" />
                Marcar todas
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={filtro === "todas" ? "default" : "outline"}
            size="sm"
            onClick={() => setFiltro("todas")}
            className={cn(
              "rounded-full text-xs font-semibold whitespace-nowrap",
              filtro === "todas"
                ? "bg-primary hover:bg-primary/90"
                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            Todas
            <Badge
              variant="secondary"
              className="ml-2 bg-white/20 text-white text-[10px]"
            >
              {notificacoes.length}
            </Badge>
          </Button>

          <Button
            variant={filtro === "nao-lidas" ? "default" : "outline"}
            size="sm"
            onClick={() => setFiltro("nao-lidas")}
            className={cn(
              "rounded-full text-xs font-semibold whitespace-nowrap",
              filtro === "nao-lidas"
                ? "bg-primary hover:bg-primary/90"
                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            Não lidas
            {naoLidas > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 bg-red-500/80 text-white text-[10px]"
              >
                {naoLidas}
              </Badge>
            )}
          </Button>

          <Button
            variant={filtro === "lidas" ? "default" : "outline"}
            size="sm"
            onClick={() => setFiltro("lidas")}
            className={cn(
              "rounded-full text-xs font-semibold whitespace-nowrap",
              filtro === "lidas"
                ? "bg-primary hover:bg-primary/90"
                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            Lidas
          </Button>
        </div>
      </div>

      {/* Lista de Notificações */}
      <div className="max-w-4xl mx-auto px-4">
        {error ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-white/80 mb-2">
              Erro ao carregar notificações
            </h3>
            <p className="text-sm text-white/40 text-center max-w-sm mb-6">
              Não foi possível carregar suas notificações. Tente novamente.
            </p>
            <Button
              onClick={() => refetch()}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-white/50 mt-4 text-sm">Carregando notificações...</p>
          </div>
        ) : notificacoesFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Bell className="h-10 w-10 text-white/20" />
            </div>
            <h3 className="text-lg font-bold text-white/80 mb-2">
              {filtro === "nao-lidas"
                ? "Nenhuma notificação não lida"
                : filtro === "lidas"
                ? "Nenhuma notificação lida"
                : "Nenhuma notificação"}
            </h3>
            <p className="text-sm text-white/40 text-center max-w-sm">
              {filtro === "nao-lidas"
                ? "Você já leu todas as suas notificações!"
                : filtro === "lidas"
                ? "Você ainda não tem notificações lidas."
                : "Quando houver novidades, elas aparecerão aqui."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notificacoesFiltradas.map((notificacao) => (
              <button
                key={notificacao.id}
                onClick={() => handleClick(notificacao)}
                className={cn(
                  "w-full flex items-start gap-4 p-4 rounded-xl text-left transition-all duration-200",
                  "border border-white/10 hover:border-white/20",
                  "hover:bg-white/5 active:scale-[0.99]",
                  !notificacao.lida
                    ? "bg-primary/5 border-primary/20"
                    : "bg-white/[0.02]"
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0",
                    !notificacao.lida
                      ? "bg-primary/20"
                      : "bg-white/5"
                  )}
                >
                  {getNotificationIcon(notificacao.tipo)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4
                      className={cn(
                        "text-base leading-tight",
                        notificacao.lida
                          ? "text-white/70"
                          : "text-white font-semibold"
                      )}
                    >
                      {notificacao.titulo}
                    </h4>
                    {!notificacao.lida && (
                      <span className="h-2.5 w-2.5 rounded-full bg-primary flex-shrink-0 shadow-[0_0_8px_rgba(5,96,179,0.6)]" />
                    )}
                  </div>

                  <p className="text-sm text-white/50 mt-1 line-clamp-2">
                    {notificacao.mensagem}
                  </p>

                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs text-white/30">
                      {formatDistanceToNow(new Date(notificacao.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                    <span className="text-white/20">•</span>
                    <span className="text-xs text-white/30">
                      {format(new Date(notificacao.created_at), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                </div>

                {/* Action */}
                {notificacao.link && (
                  <div className="flex-shrink-0 self-center">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                      <ArrowLeft className="h-4 w-4 text-white/30 -rotate-90" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
