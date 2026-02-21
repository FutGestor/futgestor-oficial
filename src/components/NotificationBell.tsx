import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  useNotificacoes,
  useNotificacoesNaoLidas,
  useMarcarNotificacaoLida,
  useMarcarTodasLidas,
  useNotificacoesRealtime,
  getNotificationIcon,
} from "@/hooks/useNotificacoes";
import { useOptionalTeamSlug } from "@/hooks/useTeamSlug";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const teamSlug = useOptionalTeamSlug();
  const basePath = teamSlug?.basePath || "";

  const { data: notificacoes = [] } = useNotificacoes();
  const { data: naoLidas = 0 } = useNotificacoesNaoLidas();
  const marcarLida = useMarcarNotificacaoLida();
  const marcarTodasLidas = useMarcarTodasLidas();

  // Activate realtime subscription
  useNotificacoesRealtime();

  const displayNotifications = notificacoes.slice(0, 8);

  const handleClick = (notificacao: { id: string; link: string | null; lida: boolean }) => {
    if (!notificacao.lida) {
      marcarLida.mutate(notificacao.id);
    }
    setOpen(false);
    if (notificacao.link) {
      // Normalizar: garantir que começa com / e sem barras duplicadas
      let path = notificacao.link.replace(/\/+/g, "/");
      if (!path.startsWith("/")) path = `/${path}`;
      // Fechar popover primeiro, depois navegar
      setTimeout(() => navigate(path), 100);
    }
  };

  const handleClearAll = () => {
    marcarTodasLidas.mutate();
  };

  const handleViewAll = () => {
    navigate(`${basePath}/notificacoes`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <Bell className="h-5 w-5" />
          {naoLidas > 0 && (
            <span className="absolute -top-1 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white shadow-lg ring-1 ring-white/20 animate-in zoom-in">
              {naoLidas > 9 ? "9+" : naoLidas}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[340px] p-0 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10">
          <h3 className="text-sm font-black uppercase tracking-wider text-white/90">
            Notificações
          </h3>
          {naoLidas > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              disabled={marcarTodasLidas.isPending}
              className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1"
            >
              <Check className="h-3 w-3" />
              Limpar
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {displayNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4">
            <Bell className="h-8 w-8 text-white/20 mb-2" />
            <p className="text-sm text-white/40 text-center">
              Nenhuma notificação
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[360px]">
            <div className="py-1">
              {displayNotifications.map((notificacao) => (
                <button
                  key={notificacao.id}
                  onClick={() => handleClick(notificacao)}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors duration-200 hover:bg-white/5",
                    !notificacao.lida && "bg-primary/5"
                  )}
                >
                  {/* Icon */}
                  <span className="text-lg mt-0.5 flex-shrink-0">
                    {getNotificationIcon(notificacao.tipo)}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm leading-tight",
                      notificacao.lida ? "text-white/70" : "text-white font-semibold"
                    )}>
                      {notificacao.titulo}
                    </p>
                    <p className="text-xs text-white/50 mt-0.5 line-clamp-2">
                      {notificacao.mensagem}
                    </p>
                    <p className="text-[10px] text-white/30 mt-1">
                      {formatDistanceToNow(new Date(notificacao.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {!notificacao.lida && (
                    <span className="mt-2 h-2 w-2 rounded-full bg-primary flex-shrink-0 shadow-[0_0_6px_rgba(5,96,179,0.6)]" />
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Footer */}
        {notificacoes.length > 0 && (
          <div className="border-t border-white/10 p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewAll}
              className="w-full text-xs text-primary hover:text-primary hover:bg-primary/10 font-semibold"
            >
              Ver todas →
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
