import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users, Calendar } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEscalacoes, useEscalacaoJogadores, useProximaEscalacao } from "@/hooks/useData";
import { positionLabels, modalityLabels, type GameModality } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { SocietyField } from "@/components/SocietyField";

function EscalacaoCard({ escalacao, isSelected, onClick }: { 
  escalacao: { id: string; jogo: { adversario: string; data_hora: string }; formacao: string }; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">vs {escalacao.jogo.adversario}</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(escalacao.jogo.data_hora), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
          <Badge variant="secondary">{escalacao.formacao}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EscalacaoPage() {
  const { data: escalacoes, isLoading: loadingEscalacoes } = useEscalacoes();
  const { data: proximaEscalacao } = useProximaEscalacao();
  const [selectedId, setSelectedId] = useState<string | undefined>();

  const currentId = selectedId || proximaEscalacao?.id;
  const { data: jogadores, isLoading: loadingJogadores } = useEscalacaoJogadores(currentId);

  const currentEscalacao = escalacoes?.find((e) => e.id === currentId) || proximaEscalacao;

  return (
    <Layout>
      <div className="container py-8 px-4 md:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">Escalação</h1>
          <p className="text-muted-foreground">Veja a escalação do time para os jogos</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Soccer Field */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {currentEscalacao ? (
                      <>
                        vs {currentEscalacao.jogo?.adversario}
                      </>
                    ) : (
                      "Escalação"
                    )}
                  </CardTitle>
                  {currentEscalacao && (
                    <div className="flex gap-2">
                      <Badge variant="secondary">{currentEscalacao.formacao}</Badge>
                      <Badge variant="outline">
                        {modalityLabels[(currentEscalacao as any).modalidade as GameModality] || 'Society 6x6'}
                      </Badge>
                    </div>
                  )}
                </div>
                {currentEscalacao?.jogo && (
                  <p className="text-sm text-muted-foreground">
                    <Calendar className="mr-1 inline h-4 w-4" />
                    {format(new Date(currentEscalacao.jogo.data_hora), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {loadingJogadores ? (
                  <Skeleton className="mx-auto aspect-[3/4] w-full max-w-md" />
                ) : (
                  <SocietyField
                    modalidade={((currentEscalacao as any)?.modalidade as GameModality) || 'society-6'}
                    formacao={currentEscalacao?.formacao || '2-2-2'}
                    jogadores={
                      jogadores?.filter(ej => ej.posicao_campo !== 'banco').map((ej) => ({
                        jogador: ej.jogador!,
                        posicao_campo: ej.posicao_campo,
                      })) || []
                    }
                  />
                )}
              </CardContent>
            </Card>

            {/* Banco de Reservas */}
            {jogadores && jogadores.filter(j => j.posicao_campo === 'banco').length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">🪑 Banco de Reservas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {jogadores.filter(ej => ej.posicao_campo === 'banco').map((ej) => (
                      <div
                        key={ej.id}
                        className="flex items-center gap-2 rounded-full bg-muted px-4 py-2"
                      >
                        {ej.jogador?.foto_url ? (
                          <img
                            src={ej.jogador.foto_url}
                            alt={ej.jogador.nome}
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {ej.jogador?.numero || "?"}
                          </div>
                        )}
                        <span className="text-sm font-medium">
                          {ej.jogador?.apelido || ej.jogador?.nome}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lista de jogadores escalados (campo) */}
            {jogadores && jogadores.filter(j => j.posicao_campo !== 'banco').length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Jogadores Titulares</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {jogadores.filter(ej => ej.posicao_campo !== 'banco').map((ej) => (
                      <div
                        key={ej.id}
                        className="flex items-center gap-3 rounded-lg border p-2"
                      >
                        {ej.jogador?.foto_url ? (
                          <img
                            src={ej.jogador.foto_url}
                            alt={ej.jogador.nome}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                            {ej.jogador?.numero || "?"}
                          </div>
                        )}
                        <div>
                          <p className="font-medium">
                            {ej.jogador?.apelido || ej.jogador?.nome}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {ej.jogador?.posicao && positionLabels[ej.jogador.posicao]}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Histórico de escalações */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Escalações</h2>
            
            {loadingEscalacoes ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : escalacoes && escalacoes.length > 0 ? (
              <div className="space-y-3">
                {escalacoes.map((esc) => (
                  <EscalacaoCard
                    key={esc.id}
                    escalacao={{ 
                      id: esc.id, 
                      jogo: esc.jogo!, 
                      formacao: esc.formacao 
                    }}
                    isSelected={esc.id === currentId}
                    onClick={() => setSelectedId(esc.id)}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhuma escalação publicada.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
