import { useState } from "react";
import { SocietyField } from "@/components/SocietyField";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, RefreshCcw, Trophy, Users } from "lucide-react";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type GameModality,
  formacoesPorModalidade,
  type Jogador,
  positionSlotsByFormation,
  positionSlotLabels
} from "@/lib/types";

// Dados mockados para o playground
const MOCK_PLAYERS: Jogador[] = [
  { id: "p1", nome: "Você", apelido: "Craque", posicao: "atacante", numero: 10, foto_url: null } as any,
  { id: "p2", nome: "Goleiro", apelido: "Paredão", posicao: "goleiro", numero: 1, foto_url: null } as any,
  { id: "p3", nome: "Defensor", apelido: "Xerife", posicao: "zagueiro", numero: 3, foto_url: null } as any,
  { id: "p4", nome: "Meia", apelido: "Maestro", posicao: "meia", numero: 8, foto_url: null } as any,
  { id: "p5", nome: "Veloz", apelido: "Ligeirinho", posicao: "atacante", numero: 7, foto_url: null } as any,
  { id: "p6", nome: "Fixo", apelido: "Capitão", posicao: "zagueiro", numero: 4, foto_url: null } as any,
  { id: "p7", nome: "Coringa", apelido: "Versátil", posicao: "meia", numero: 5, foto_url: null } as any,
  { id: "p8", nome: "Lateral", apelido: "Ala", posicao: "lateral", numero: 2, foto_url: null } as any,
  { id: "p9", nome: "Volante", apelido: "Cão", posicao: "volante", numero: 5, foto_url: null } as any,
  { id: "p10", nome: "Ponta", apelido: "Flecha", posicao: "atacante", numero: 11, foto_url: null } as any,
  { id: "p11", nome: "Centro", apelido: "Matador", posicao: "atacante", numero: 9, foto_url: null } as any,
  { id: "p12", nome: "Meia 2", apelido: "Pensador", posicao: "meia", numero: 14, foto_url: null } as any,
  { id: "p13", nome: "Zagueiro 2", apelido: "Torre", posicao: "zagueiro", numero: 13, foto_url: null } as any,
];

export function LandingPlayground() {
  const [modalidade, setModalidade] = useState<GameModality>("society-6");
  const [formacao, setFormacao] = useState("2-2-1");
  const [jogadoresEmCampo, setJogadoresEmCampo] = useState<
    Array<{ jogador: Jogador; posicao_campo: string }>
  >([
    { jogador: MOCK_PLAYERS[1], posicao_campo: "goleiro" }, // Goleiro já começa
  ]);
  const [posicoesCustomizadas, setPosicoesCustomizadas] = useState<Record<string, string>>({});

  const handleDragStart = (e: React.DragEvent, jogadorId: string) => {
    e.dataTransfer.setData("text/plain", jogadorId);
  };

  const jogadoresDisponiveis = MOCK_PLAYERS.filter(
    (p) => !jogadoresEmCampo.some((jc) => jc.jogador.id === p.id)
  );

  const handleReset = () => {
    setJogadoresEmCampo([{ jogador: MOCK_PLAYERS[1], posicao_campo: "goleiro" }]);
    setPosicoesCustomizadas({});
  };

  const handleAddPlayer = (jogador: Jogador) => {
    const slotsDaFormacao = positionSlotsByFormation[formacao] || [];
    const slotsOcupados = jogadoresEmCampo.map((jc) => jc.posicao_campo);
    const slotsLivres = slotsDaFormacao.filter((slot) => !slotsOcupados.includes(slot));

    if (slotsLivres.length === 0) return; // Time cheio

    // Tentar encontrar um slot que combine com a posição do jogador
    // Mapeamento: jogador.posicao (tipo) -> label do slot (sigla)
    const slotIdeal = slotsLivres.find((slot) => {
      const label = positionSlotLabels[slot]; // Retorna 'ATA', 'ZAG', etc.
      
      if (jogador.posicao === 'goleiro' && label === 'GOL') return true;
      if (jogador.posicao === 'atacante' && (label === 'ATA' || label === 'PTE' || label === 'PTD')) return true;
      if (jogador.posicao === 'zagueiro' && (label === 'ZAG' || label === 'LTD' || label === 'LTE')) return true;
      if (jogador.posicao === 'meia' && (label === 'MEI' || label === 'ME' || label === 'MD' || label === 'VOL')) return true;
      if (jogador.posicao === 'lateral' && (label === 'LTD' || label === 'LTE' || label === 'LAT')) return true;
      if (jogador.posicao === 'volante' && (label === 'VOL' || label === 'MEI')) return true;
      return false;
    });

    const destino = slotIdeal || slotsLivres[0];

    setJogadoresEmCampo((prev) => [...prev, { jogador, posicao_campo: destino }]);
  };

  return (
    <section className="relative overflow-hidden bg-slate-950 py-24">
      {/* Background element */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-900/20 via-slate-950 to-slate-950" />

      <div className="container relative z-10 px-4 md:px-6">
        <div className="mb-12 text-center">
          <Badge variant="outline" className="mb-4 border-green-500/50 text-green-400">
            Teste Interativo
          </Badge>
          <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl">
            Sinta o poder da <span className="text-green-400">Prancheta</span>
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Arraste os jogadores, monte sua tática e veja como é fácil organizar seu time.
            Sem cadastro, é só testar.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_300px]">
          {/* Área do Campo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 shadow-2xl backdrop-blur"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-2">
                <Select
                  value={modalidade}
                  onValueChange={(v: any) => {
                    setModalidade(v);
                    setFormacao(formacoesPorModalidade[v as GameModality]?.[0] || '2-2-1');
                    handleReset();
                  }}
                >
                  <SelectTrigger className="w-[140px] bg-slate-800 text-white border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="society-6">Society 6</SelectItem>
                    <SelectItem value="society-7">Society 7</SelectItem>
                    <SelectItem value="futsal">Futsal</SelectItem>
                    <SelectItem value="campo-11">Campo 11</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={formacao}
                  onValueChange={(novaFormacao) => {
                    setFormacao(novaFormacao);
                    
                    // 1. Identificar vagas disponíveis na nova formação
                    // Fazemos uma cópia para ir removendo as vagas conforme são preenchidas
                    const vagasDisponiveis = [...(positionSlotsByFormation[novaFormacao] || [])];
                    
                    // Resetar posições customizadas
                    setPosicoesCustomizadas({});

                    // 2. Separar jogadores em dois grupos:
                    //    A. Quem já está em uma posição válida na nova formação (Prioridade)
                    //    B. Quem precisa ser realocado
                    
                    const jogadoresMantidos: Array<{ jogador: Jogador; posicao_campo: string }> = [];
                    const jogadoresParaRealocar: Jogador[] = [];

                    // Precisamos iterar sobre os jogadores atuais e verificar se sua posição atual ainda existe
                    // E se essa posição ainda está "livre" (caso tenhamos duplicatas por algum motivo bizarro anterior)
                    const jogadoresAtuais = [...jogadoresEmCampo];

                    jogadoresAtuais.forEach((jc) => {
                      const indexVaga = vagasDisponiveis.indexOf(jc.posicao_campo);
                      
                      if (indexVaga !== -1) {
                        // A vaga existe e está livre. O jogador mantém a posição.
                        jogadoresMantidos.push(jc);
                        vagasDisponiveis.splice(indexVaga, 1); // Marca vaga como ocupada
                      } else {
                        // A vaga não existe na nova formação ou já foi tomada.
                        jogadoresParaRealocar.push(jc.jogador);
                      }
                    });

                    // 3. Realocar os jogadores sem vaga
                    const jogadoresRealocados = jogadoresParaRealocar.map((jogador) => {
                      if (vagasDisponiveis.length === 0) {
                        // Caso extremo: Mais jogadores que vagas (não deve acontecer com lógica correta de add, mas safe guard)
                        return { jogador, posicao_campo: "reserva" }; 
                      }

                      // Tenta encontrar a melhor vaga disponível para a posição original do jogador
                      const indexMelhorVaga = vagasDisponiveis.findIndex((slot) => {
                        const label = positionSlotLabels[slot];
                        const pos = jogador.posicao;
                        
                        if (pos === 'goleiro' && label === 'GOL') return true;
                        if (pos === 'atacante' && (label === 'ATA' || label === 'PTE' || label === 'PTD' || label === 'ME' || label === 'MD')) return true;
                        if (pos === 'zagueiro' && (label === 'ZAG' || label === 'LTD' || label === 'LTE' || label === 'VOL')) return true;
                        if (pos === 'meia' && (label === 'MEI' || label === 'ME' || label === 'MD' || label === 'VOL')) return true;
                        if (pos === 'lateral' && (label === 'LTD' || label === 'LTE' || label === 'LAT')) return true;
                        if (pos === 'volante' && (label === 'VOL' || label === 'MEI' || label === 'ZAG')) return true;
                        return false;
                      });

                      // Se achou uma vaga compatível, usa ela. Se não, pega a primeira livre.
                      const indexFinal = indexMelhorVaga !== -1 ? indexMelhorVaga : 0;
                      const novaPosicao = vagasDisponiveis[indexFinal];
                      
                      // Remove a vaga usada das disponíveis
                      vagasDisponiveis.splice(indexFinal, 1);

                      return { jogador, posicao_campo: novaPosicao };
                    });

                    // 4. Junta tudo e atualiza o estado
                    // Filtra possíveis "reservas" caso tenha dado overflow
                    const novoTime = [...jogadoresMantidos, ...jogadoresRealocados].filter(j => j.posicao_campo !== "reserva");
                    
                    setJogadoresEmCampo(novoTime);
                  }}
                >
                  <SelectTrigger className="w-[140px] bg-slate-800 text-white border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formacoesPorModalidade[modalidade]?.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-slate-400 hover:text-white"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Resetar
              </Button>
            </div>

            <SocietyField
              modalidade={modalidade}
              formacao={formacao}
              jogadores={jogadoresEmCampo.map((jc) => ({
                ...jc,
                posicao_campo: posicoesCustomizadas[jc.jogador.id] || jc.posicao_campo,
              }))}
              isEditable={true}
              onPlayerMove={(id, pos) =>
                setPosicoesCustomizadas((prev) => ({ ...prev, [id]: pos }))
              }
              className="max-h-[500px] shadow-green-900/20 shadow-2xl"
            />
          </motion.div>

          {/* Lista de Jogadores */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col gap-4"
          >
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
                <Users className="h-5 w-5 text-green-400" />
                Elenco Disponível
              </h3>
              <div className="flex flex-col gap-2">
                {jogadoresDisponiveis.map((jogador) => (
                  <button
                    key={jogador.id}
                    onClick={() => handleAddPlayer(jogador)}
                    className="flex w-full items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-left transition-colors hover:border-green-500/50 hover:bg-slate-800"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-300">
                      {jogador.numero}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{jogador.apelido}</p>
                      <p className="text-xs text-slate-400">{jogador.posicao}</p>
                    </div>
                    <ArrowRight className="ml-auto h-4 w-4 text-slate-600" />
                  </button>
                ))}

                {jogadoresDisponiveis.length === 0 && (
                  <p className="text-center text-sm text-slate-500 py-4">
                    Todos os jogadores em campo!
                  </p>
                )}
              </div>
            </div>

            <div className="mt-auto rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 p-6 text-center shadow-lg">
              <Trophy className="mx-auto mb-3 h-8 w-8 text-white/90" />
              <h3 className="mb-2 text-lg font-bold text-white">Curtiu a experiência?</h3>
              <p className="mb-4 text-sm text-green-100">
                Isso é só 1% do que o FutGestor pode fazer pelo seu time.
              </p>
              <Button className="w-full bg-white text-green-700 hover:bg-green-50" asChild>
                <a href="/auth?signup=true">
                  Criar meu Time Grátis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
