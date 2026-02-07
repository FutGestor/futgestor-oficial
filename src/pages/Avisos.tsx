import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bell, AlertTriangle, DollarSign, Trophy, Megaphone } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAvisos } from "@/hooks/useData";
import { categoryLabels, type NoticeCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RequireTeam } from "@/components/RequireTeam";

function getCategoryIcon(categoria: NoticeCategory) {
  switch (categoria) {
    case "urgente":
      return <AlertTriangle className="h-5 w-5" />;
    case "financeiro":
      return <DollarSign className="h-5 w-5" />;
    case "jogo":
      return <Trophy className="h-5 w-5" />;
    default:
      return <Megaphone className="h-5 w-5" />;
  }
}

function getCategoryColor(categoria: NoticeCategory) {
  switch (categoria) {
    case "urgente":
      return "bg-destructive text-destructive-foreground";
    case "financeiro":
      return "bg-green-600 text-white";
    case "jogo":
      return "bg-primary text-primary-foreground";
    default:
      return "bg-secondary text-secondary-foreground";
  }
}

function AvisosContent() {
  const { data: avisos, isLoading } = useAvisos();

  return (
    <Layout>
      <div className="container py-8 px-4 md:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">Avisos</h1>
          <p className="text-muted-foreground">Comunicados e informações importantes do time</p>
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
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : avisos && avisos.length > 0 ? (
              <div className="space-y-4">
                {avisos.map((aviso) => (
                  <div
                    key={aviso.id}
                    className={cn(
                      "rounded-lg border p-4 transition-colors",
                      aviso.categoria === "urgente" && "border-l-4 border-l-destructive bg-destructive/5"
                    )}
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge className={getCategoryColor(aviso.categoria)}>
                        <span className="mr-1">{getCategoryIcon(aviso.categoria)}</span>
                        {categoryLabels[aviso.categoria]}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(aviso.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>

                    <h3 className="mb-2 text-lg font-semibold">{aviso.titulo}</h3>
                    
                    <p className="whitespace-pre-wrap text-muted-foreground">
                      {aviso.conteudo}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-muted-foreground">
                <Bell className="mx-auto mb-4 h-16 w-16 opacity-50" />
                <p className="text-lg">Nenhum aviso publicado ainda.</p>
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
