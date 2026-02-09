import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Transacao } from "@/lib/types";

interface MonthlyTransactionGroupProps {
  monthKey: string;
  transacoes: Transacao[];
}

export function MonthlyTransactionGroup({ monthKey, transacoes }: MonthlyTransactionGroupProps) {
  const [open, setOpen] = useState(true);

  const totalEntradas = transacoes
    .filter((t) => t.tipo === "entrada")
    .reduce((acc, t) => acc + Number(t.valor), 0);

  const totalSaidas = transacoes
    .filter((t) => t.tipo === "saida")
    .reduce((acc, t) => acc + Number(t.valor), 0);

  const saldoMes = totalEntradas - totalSaidas;

  // Parse month label from the first transaction
  const firstDate = new Date(transacoes[0].data);
  const monthLabel = format(firstDate, "MMMM 'de' yyyy", { locale: ptBR });

  const fmt = (v: number) =>
    `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full bg-[#0F2440] border border-white/[0.06] rounded-xl p-4 mb-1 text-left hover:bg-[#122d50] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {open ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
              <h3 className="text-sm font-bold text-white capitalize">{monthLabel}</h3>
            </div>
            <Badge variant="outline" className="text-[10px] border-white/10 text-gray-400">
              {transacoes.length} lançamento{transacoes.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-3 text-[11px]">
            <span className="text-green-400">+ {fmt(totalEntradas)}</span>
            <span className="text-red-400">- {fmt(totalSaidas)}</span>
            <span className={saldoMes >= 0 ? "text-[#D4A84B]" : "text-red-400"}>
              Saldo: {saldoMes >= 0 ? "+" : ""}{fmt(saldoMes)}
            </span>
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 mb-4">
          {transacoes.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between bg-[#0A1628] border border-white/[0.04] rounded-lg px-4 py-3"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-gray-300">{t.descricao}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-600">
                    {format(new Date(t.data), "dd/MM/yyyy")}
                  </span>
                  <Badge variant="outline" className="text-[9px] border-white/10 text-gray-500">
                    {t.categoria}
                  </Badge>
                </div>
              </div>
              <span
                className={`text-sm font-bold ${
                  t.tipo === "entrada" ? "text-green-400" : "text-red-400"
                }`}
              >
                {t.tipo === "entrada" ? "+" : "-"} R${" "}
                {Number(t.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
