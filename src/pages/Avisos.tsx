import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bell, AlertTriangle, DollarSign, Trophy, Megaphone, CheckCheck, Eye, Settings2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAvisos } from "@/hooks/useData";
import { useAvisoLeituras, useMarcarAvisoLido, useMarcarTodosLidos } from "@/hooks/useAvisoLeituras";
import { categoryLabels, type NoticeCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RequireTeam } from "@/components/RequireTeam";
import { useAuth } from "@/hooks/useAuth";
import { useTeamSlug } from "@/hooks/useTeamSlug";
import { useNavigate } from "react-router-dom";

type FilterType = "todos" | "nao_lidos" | "lidos";

function getCategoryIcon(categoria: NoticeCategory) {
  switch (categoria) {
    case "urgente": return <AlertTriangle className="h-5 w-5" />;
    case "financeiro": return <DollarSign className="h-5 w-5" />;
    case "jogo": return <Trophy className="h-5 w-5" />;
    default: return <Megaphone className="h-5 w-5" />;
  }
}

function getCategoryColor(categoria: NoticeCategory) {
  switch (categoria) {
    case "urgente": return "bg-destructive text-destructive-foreground";
    case "financeiro": return "bg-green-600 text-white";
    case "jogo": return "bg-primary text-primary-foreground";
    default: return "bg-secondary text-secondary-foreground";
  }
}

function AvisosContent() {
  const { isAdmin } = useAuth();
  const { basePath } = useTeamSlug();
  const navigate = useNavigate();
  const { data: avisos, isLoading } = useAvisos();
  const { data: lidos } = useAvisoLeituras();
  const marcarLido = useMarcarAvisoLido();
  const marcarTodos = useMarcarTodosLidos();
  const [filtro, setFiltro] = useState<FilterType>("todos");
  const [expandido, setExpandido] = useState<string | null>(null);

  const isLido = (id: string) => lidos?.has(id) ?? false;

  const naoLidosCount = avisos?.filter((a) => !isLido(a.id)).length ?? 0;

  const avisosFiltrados = avisos?.filter((a) => {
    if (filtro === "nao_lidos") return !isLido(a.id);
    if (filtro === "lidos") return isLido(a.id);
    return true;
  });

  const handleExpandir = (aviso: { id: string }) => {
    setExpandido(expandido === aviso.id ? null : aviso.id);
    if (!isLido(aviso.id)) {
      marcarLido.mutate(aviso.id);
    }
  };

  const handleMarcarTodos = () => {
    if (!avisos) return;
    const naoLidos = avisos.filter((a) => !isLido(a.id)).map((a) => a.id);
    if (naoLidos.length > 0) {
      marcarTodos.mutate(naoLidos);
    }
  };

  return (
    <Layout>
      <div className="container py-8 px-4 md:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Avisos</h1>
            <p className="text-muted-foreground">Comunicados e informações importantes do time</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <Button 
                onClick={() => navigate(`${basePath}/admin/avisos`)}
                className="gap-2"
              >
                <Settings2 className="h-4 w-4" />
                Gerenciar Mural
              </Button>
            )}
            {naoLidosCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarcarTodos}
                disabled={marcarTodos.isPending}
              >
                <CheckCheck className="mr-1 h-4 w-4" />
                Marcar todos como lidos
              </Button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          {([
            { value: "todos", label: "Todos" },
            { value: "nao_lidos", label: `Não lidos${naoLidosCount > 0 ? ` (${naoLidosCount})` : ""}` },
            { value: "lidos", label: "Lidos" },
          ] as const).map((f) => (
            <Button
              key={f.value}
              variant={filtro === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltro(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Mural de Avisos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : avisosFiltrados && avisosFiltrados.length > 0 ? (
              <div className="space-y-3">
                {avisosFiltrados.map((aviso) => {
                  const lido = isLido(aviso.id);
                  const aberto = expandido === aviso.id;

                  return (
                    <button
                      key={aviso.id}
                      onClick={() => handleExpandir(aviso)}
                      className={cn(
                        "w-full rounded-lg border p-4 text-left transition-colors",
                        aviso.categoria === "urgente" && "border-l-4 border-l-destructive bg-destructive/5",
                        !lido && "bg-primary/5 border-primary/20",
                        lido && "opacity-80"
                      )}
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {!lido && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                        <Badge className={getCategoryColor(aviso.categoria)}>
                          <span className="mr-1">{getCategoryIcon(aviso.categoria)}</span>
                          {categoryLabels[aviso.categoria]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(aviso.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </span>
                        {lido && (
                          <Eye className="h-3 w-3 text-muted-foreground ml-auto" />
                        )}
                      </div>

                      <h3 className={cn("text-lg", !lido ? "font-bold" : "font-medium")}>
                        {aviso.titulo}
                      </h3>

                      {aberto && (
                        <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                          {aviso.conteudo}
                        </p>
                      )}

                      {!aberto && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                          {aviso.conteudo}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center text-muted-foreground">
                <Bell className="mx-auto mb-4 h-16 w-16 opacity-50" />
                <p className="text-lg">
                  {filtro === "nao_lidos" ? "Nenhum aviso não lido." : "Nenhum aviso publicado ainda."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default function AvisosPage() {
  return (
    <RequireTeam>
      <AvisosContent />
    </RequireTeam>
  );
}
