import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Monitor, Puzzle, Tag, MapPin, Users, Receipt } from "lucide-react";

interface ResumoData {
  sistemaNome: string;
  sistemaValor: number;
  modulosSelecionados: { nome: string; valor: number }[];
  planoNome: string;
  descontoPercent: number;
  descontoValor: number;
  descontoManualPercent: number;
  descontoManualValor: number;
  descontoManualReais: number;
  mensalidadeBase: number;
  mensalidadeFinal: number;
  implantacaoKm: number;
  implantacaoKmValor: number;
  implantacaoRegiaoNome: string;
  implantacaoRegiaoValor: number;
  implantacaoDiarias: number;
  implantacaoDiariasValor: number;
  implantacaoBruto: number;
  descontoImplPercent: number;
  descontoImplPercentVal: number;
  descontoImplReais: number;
  implantacaoTotal: number;
  parceiroNome: string;
  comissaoImplantacao: number;
  comissaoRecorrente: number;
  formaPagamento: string;
  formaPagamentoImpl: string;
  fluxoImplantacao: string;
  parcelasImplantacao: number;
}

interface Props {
  data: ResumoData;
  onGerarProposta: () => void;
  gerando?: boolean;
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function PropostaResumoLateral({ data, onGerarProposta, gerando }: Props) {
  const valorTotal = data.mensalidadeFinal + data.implantacaoTotal;

  return (
    <div className="sticky top-4 space-y-3">
      <Card className="border-primary/20 bg-gradient-to-b from-primary/5 to-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Resumo da Proposta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {/* Sistema */}
          {data.sistemaNome && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium uppercase tracking-wider">
                <Monitor className="h-3 w-3" /> Sistema
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{data.sistemaNome}</span>
              </div>
            </div>
          )}

          {/* Módulos */}
          {data.modulosSelecionados.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium uppercase tracking-wider">
                <Puzzle className="h-3 w-3" /> Módulos ({data.modulosSelecionados.length})
              </div>
              {data.modulosSelecionados.map((m, i) => (
                <div key={i} className="flex justify-between text-xs pl-4">
                  <span>{m.nome}</span>
                  <span>{fmt(m.valor)}</span>
                </div>
              ))}
            </div>
          )}

          <Separator />

          {/* Mensalidade */}
          <div className="space-y-1">
            <div className="flex justify-between text-muted-foreground">
              <span>Mensalidade base</span>
              <span>{fmt(data.mensalidadeBase)}</span>
            </div>
            {data.descontoPercent > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> Desconto {data.planoNome} ({data.descontoPercent}%)</span>
                <span>-{fmt(data.descontoValor)}</span>
              </div>
            )}
            {data.descontoManualPercent > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> Desconto adicional ({data.descontoManualPercent}%)</span>
                <span>-{fmt(data.descontoManualValor)}</span>
              </div>
            )}
            {data.descontoManualReais > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> Desconto adicional (R$)</span>
                <span>-{fmt(data.descontoManualReais)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <span>Mensalidade final</span>
              <span className="text-primary">{fmt(data.mensalidadeFinal)}</span>
            </div>
          </div>

          <Separator />

          {/* Implantação */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium uppercase tracking-wider">
              <MapPin className="h-3 w-3" /> Implantação
            </div>
            {data.implantacaoKm > 0 && (
              <div className="flex justify-between text-xs pl-4">
                <span>{data.implantacaoKm} km</span>
                <span>{fmt(data.implantacaoKmValor)}</span>
              </div>
            )}
            {data.implantacaoRegiaoNome && (
              <div className="flex justify-between text-xs pl-4">
                <span>Região: {data.implantacaoRegiaoNome}</span>
                <span>{fmt(data.implantacaoRegiaoValor)}</span>
              </div>
            )}
            {data.implantacaoDiarias > 0 && (
              <div className="flex justify-between text-xs pl-4">
                <span>{data.implantacaoDiarias} diária(s)</span>
                <span>{fmt(data.implantacaoDiariasValor)}</span>
              </div>
            )}
            {(data.descontoImplPercent > 0 || data.descontoImplReais > 0) && (
              <>
                {data.descontoImplPercent > 0 && (
                  <div className="flex justify-between text-xs pl-4 text-emerald-600 dark:text-emerald-400">
                    <span>Desconto ({data.descontoImplPercent}%)</span>
                    <span>-{fmt(data.descontoImplPercentVal)}</span>
                  </div>
                )}
                {data.descontoImplReais > 0 && (
                  <div className="flex justify-between text-xs pl-4 text-emerald-600 dark:text-emerald-400">
                    <span>Desconto (R$)</span>
                    <span>-{fmt(data.descontoImplReais)}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between font-semibold">
              <span>Total implantação</span>
              <span>{fmt(data.implantacaoTotal)}</span>
            </div>
            {data.fluxoImplantacao === "parcelado" && data.parcelasImplantacao > 1 && (
              <div className="text-xs text-muted-foreground pl-4">
                {data.parcelasImplantacao}x de {fmt(data.implantacaoTotal / data.parcelasImplantacao)}
              </div>
            )}
          </div>

          {/* Comissão */}
          {data.parceiroNome && (
            <>
              <Separator />
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  <Users className="h-3 w-3" /> Parceiro: {data.parceiroNome}
                </div>
                {data.comissaoImplantacao > 0 && (
                  <div className="flex justify-between text-xs pl-4">
                    <span>Comissão implantação</span>
                    <span>{fmt(data.comissaoImplantacao)}</span>
                  </div>
                )}
                {data.comissaoRecorrente > 0 && (
                  <div className="flex justify-between text-xs pl-4">
                    <span>Comissão recorrente</span>
                    <span>{fmt(data.comissaoRecorrente)}/mês</span>
                  </div>
                )}
              </div>
            </>
          )}

          {(data.formaPagamento || data.formaPagamentoImpl) && (
            <>
              <Separator />
              <div className="space-y-1">
                {data.formaPagamento && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Receipt className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Pgto. mensalidade:</span>
                    <span className="font-medium">{data.formaPagamento}</span>
                  </div>
                )}
                {data.formaPagamentoImpl && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Receipt className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Pgto. implantação:</span>
                    <span className="font-medium">{data.formaPagamentoImpl}</span>
                  </div>
                )}
              </div>
            </>
          )}

          <Separator />

          {/* Valor Total */}
          <div className="rounded-lg bg-primary/10 p-3 text-center space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Valor Total</p>
            <p className="text-2xl font-bold text-primary">{fmt(valorTotal)}</p>
            <p className="text-[10px] text-muted-foreground">
              {fmt(data.mensalidadeFinal)}/mês + {fmt(data.implantacaoTotal)} implantação
            </p>
          </div>

          <Button className="w-full gap-2" onClick={onGerarProposta} disabled={gerando}>
            <Sparkles className="h-4 w-4" />
            {gerando ? "Gerando..." : "Gerar Proposta"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
