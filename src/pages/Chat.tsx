import { useState, useRef, useEffect, useCallback } from "react";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Send, ArrowDown, Trash2, MessageSquare, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import {
  useChatMessages, useSendMessage, useDeleteMessage,
  useChatRealtime, useTeamMemberCount, type ChatMensagem
} from "@/hooks/useChat";
// @ts-ignore
import { useMarkChatRead } from "@/hooks/useChatNotifications";

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return "Hoje";
  if (isYesterday(date)) return "Ontem";
  return format(date, "dd 'de' MMMM", { locale: ptBR });
}

function groupMessagesByDate(messages: ChatMensagem[]): { label: string; messages: ChatMensagem[] }[] {
  const groups: { label: string; messages: ChatMensagem[] }[] = [];
  let currentLabel = "";

  for (const msg of messages) {
    const label = formatDateLabel(msg.created_at);
    if (label !== currentLabel) {
      currentLabel = label;
      groups.push({ label, messages: [msg] });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }
  return groups;
}

function MessageBubble({
  msg, isOwn, isAdmin, onDelete, showAvatar
}: {
  msg: ChatMensagem;
  isOwn: boolean;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  showAvatar: boolean;
}) {
  if (msg.tipo === "sistema") {
    return (
      <div className="flex justify-center my-2">
        <span className="text-zinc-500 italic text-xs bg-white/5 rounded-full px-4 py-1">
          {msg.conteudo}
        </span>
      </div>
    );
  }

  const canDelete = isOwn || isAdmin;
  const displayName = msg.jogador?.apelido || msg.jogador?.nome || "Jogador";
  const fotoUrl = msg.jogador?.foto_url;

  return (
    <div className={cn("flex flex-col mb-1 group", isOwn ? "items-end" : "items-start")}>
      
      {/* Header: Avatar Name Time - Only show if showAvatar is true */}
      {showAvatar && (
        <div className={cn("flex items-center gap-2 mb-1 px-1 mt-3", isOwn ? "flex-row-reverse" : "flex-row")}>
          {/* Avatar */}
          <div className="flex-shrink-0">
            {fotoUrl ? (
              <img src={fotoUrl} alt={displayName} className="h-5 w-5 rounded-full object-cover shadow-sm bg-zinc-800" />
            ) : (
              <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-[9px] font-bold text-white/60">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          {/* Name */}
          <span className="text-[11px] font-bold text-white/90 tracking-wide">
            {displayName}
          </span>

          {/* Time */}
          <span className="text-[10px] text-white/40 font-medium tabular-nums">
            {format(new Date(msg.created_at), "HH:mm")}
          </span>
        </div>
      )}

      {/* Message Bubble */}
      <div className="relative max-w-[85%]">
        <Popover>
          <PopoverTrigger asChild>
            <div className={cn(
              "px-4 py-3 text-sm break-words whitespace-pre-wrap cursor-default shadow-sm border transition-all",
              isOwn
                ? "bg-primary text-white rounded-2xl rounded-tr-sm border-primary/20 hover:bg-primary/90"
                : "bg-[#1A2737] text-white/90 rounded-2xl rounded-tl-sm border-white/5 hover:bg-[#1f2e40]", 
              canDelete && "cursor-pointer"
            )}>
              <p className="leading-relaxed">{msg.conteudo}</p>
            </div>
          </PopoverTrigger>
          
          {canDelete && (
            <PopoverContent className="w-auto p-1 bg-[#1A2737] border-white/10" side={isOwn ? "left" : "right"} align="start">
              <Button variant="ghost" size="sm" className="text-destructive text-xs gap-1.5 h-8 hover:bg-white/5 w-full justify-start"
                onClick={() => onDelete(msg.id)}>
                <Trash2 className="h-3 w-3" />Apagar
              </Button>
            </PopoverContent>
          )}
        </Popover>
      </div>
    </div>
  );
}

export default function Chat() {
  const { team } = useTeamSlug();
  const { profile, isAdmin, user } = useAuth();
  const userId = user?.id;

  const { data: messages = [], isLoading } = useChatMessages(team?.id);
  const { data: memberCount = 0 } = useTeamMemberCount(team?.id);
  const { mutate: markRead } = useMarkChatRead();
  const sendMessage = useSendMessage();
  const deleteMessage = useDeleteMessage();

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (team?.id && markRead) {
      markRead(team.id);
    }
  }, [team?.id, markRead, messages.length]);
  // eslint-enable react-hooks/exhaustive-deps
  
  const onlineCount = useChatRealtime(team?.id);

  const [inputValue, setInputValue] = useState("");
  const [showScrollDown, setShowScrollDown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isAtBottomRef = useRef(true);
  const prevMessageCountRef = useRef(0);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  // Scroll on new messages if user is at bottom
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current && isAtBottomRef.current) {
      setTimeout(() => scrollToBottom(), 50);
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length, scrollToBottom]);

  // Initial scroll
  const hasMessages = !isLoading && messages.length > 0;
  useEffect(() => {
    if (hasMessages) {
      setTimeout(() => scrollToBottom(false), 100);
    }
   
  }, [hasMessages]);

  // Track scroll position
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    isAtBottomRef.current = distanceFromBottom < 80;
    setShowScrollDown(distanceFromBottom > 200);
  };

  // Send message
  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || !team?.id) return;
    sendMessage.mutate({ teamId: team.id, conteudo: trimmed });
    setInputValue("");
    isAtBottomRef.current = true;
    setTimeout(() => scrollToBottom(), 50);
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDelete = (messageId: string) => {
    if (!team?.id) return;
    deleteMessage.mutate({ messageId, teamId: team.id });
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const dateGroups = groupMessagesByDate(messages);

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0A1628] z-40">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#0A1628]/95 backdrop-blur-xl safe-area-top">
        <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden" onClick={() => window.history.back()}>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Button>
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-black uppercase tracking-tight text-white truncate">
            💬 Grupo do Time
          </h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span className={onlineCount > 0 ? "text-green-500" : ""}>
              {onlineCount > 0 ? `${onlineCount} online` : `${memberCount} membros`}
            </span>
          </p>
        </div>
      </header>

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 overscroll-contain"
        onScroll={handleScroll}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Carregando mensagens...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-zinc-600" />
              </div>
              <p className="text-zinc-500 text-sm font-medium">Nenhuma mensagem ainda.</p>
              <p className="text-zinc-600 text-xs">Seja o primeiro a enviar uma mensagem!</p>
            </div>
          </div>
        ) : (
          dateGroups.map((group) => (
            <div key={group.label}>
              {/* Date separator */}
              <div className="flex justify-center my-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-white/5 rounded-full px-4 py-1">
                  {group.label}
                </span>
              </div>
              {/* Messages */}
              <div className="space-y-1">
                {group.messages.map((msg, idx) => {
                  const isOwn = msg.user_id === userId;
                  const prevMsg = idx > 0 ? group.messages[idx - 1] : null;
                  
                  // Show header (avatar/name/time) if it's the start of a new block of messages
                  const showHeader = !prevMsg || prevMsg.user_id !== msg.user_id || prevMsg.tipo === "sistema";

                  return (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      isOwn={isOwn}
                      isAdmin={isAdmin}
                      onDelete={handleDelete}
                      showAvatar={showHeader}
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollDown && (
        <div className="absolute bottom-24 right-4 z-10">
          <Button size="icon" variant="secondary"
            className="h-10 w-10 rounded-full shadow-lg bg-black/60 border border-white/10 hover:bg-black/80"
            onClick={() => scrollToBottom()}>
            <ArrowDown className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-white/5 bg-[#0A1628]/95 backdrop-blur-xl safe-area-bottom">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              rows={1}
              className="w-full resize-none rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 max-h-[120px] scrollbar-thin"
            />
          </div>
          <Button
            size="icon"
            className="h-11 w-11 rounded-full bg-primary hover:bg-primary/90 flex-shrink-0 shadow-lg shadow-primary/20"
            onClick={handleSend}
            disabled={!inputValue.trim() || sendMessage.isPending}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
