import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFinanceiro } from "@/contexts/FinanceiroContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Receipt, CalendarDays, Users, Loader2, Gift, Percent } from "lucide-react";

interface ClientRow {
  id: string;
  name: string;
  monthly_value_final: number;
  default_due_day: number | null;
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function GerarMensalidades() {
  const { profile } = useAuth();
  const { addTitulo } = useFinanceiro();
  const orgId = profile?.org_id;

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [alreadyGenerated, setAlreadyGenerated] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [courtesyMap, setCourtesyMap] = useState<Record<string, { enabled: boolean; reason: string }>>({});
  const [partialMap, setPartialMap] = useState<Record<string, { enabled: boolean; value: number }>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const competency = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [cRes, tRes] = await Promise.all([
        supabase
          .from("clients")
          .select("id, name, monthly_value_final, default_due_day")
          .eq("org_id", orgId!)
          .eq("status", "ativo")
          .eq("recurrence_active", true)
          .gt("monthly_value_final", 0)
          .order("name"),
        supabase
          .from("financial_titles")
          .select("client_id")
          .eq("org_id", orgId!)
          .eq("origin", "mensalidade")
          .eq("competency", competency)
          .eq("type", "receber"),
      ]);

      if (cancelled) return;

      const clientList = (cRes.data || []) as ClientRow[];
      const existingIds = new Set((tRes.data || []).map((r: any) => r.client_id as string));

      setClients(clientList);
      setAlreadyGenerated(existingIds);
      setSelectedIds(new Set());
      setCourtesyMap({});
      setPartialMap({});
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [orgId, competency]);

  const selectableClients = useMemo(
    () => clients.filter((c) => !alreadyGenerated.has(c.id)),
    [clients, alreadyGenerated],
  );

  const allSelected = selectableClients.length > 0 && selectableClients.every((c) => selectedIds.has(c.id));

  function toggleAll() {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(selectableClients.map((c) => c.id)));
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleCourtesy(id: string, enabled: boolean) {
    setCourtesyMap((prev) => ({
      ...prev,
      [id]: { enabled, reason: prev[id]?.reason || "" },
    }));
    // Disable partial when courtesy is enabled
    if (enabled) {
      setPartialMap((prev) => ({ ...prev, [id]: { enabled: false, value: 0 } }));
    }
    if (enabled && !selectedIds.has(id)) {
      setSelectedIds((prev) => new Set(prev).add(id));
    }
  }

  function setCourtesyReason(id: string, reason: string) {
    setCourtesyMap((prev) => ({
      ...prev,
      [id]: { ...prev[id], enabled: true, reason },
    }));
  }

  function togglePartial(id: string, enabled: boolean) {
    setPartialMap((prev) => ({
      ...prev,
      [id]: { enabled, value: prev[id]?.value || 0 },
    }));
    // Disable courtesy when partial is enabled
    if (enabled) {
      setCourtesyMap((prev) => ({ ...prev, [id]: { enabled: false, reason: "" } }));
    }
    if (enabled && !selectedIds.has(id)) {
      setSelectedIds((prev) => new Set(prev).add(id));
    }
  }

  function setPartialValue(id: string, value: number) {
    setPartialMap((prev) => ({
      ...prev,
      [id]: { ...prev[id], enabled: true, value },
    }));
  }

  function calcDueDate(dueDay: number | null) {
    const day = dueDay && dueDay >= 1 && dueDay <= 28 ? dueDay : 10;
    return `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  async function handleGenerate() {
    const toGenerate = clients.filter((c) => selectedIds.has(c.id));
    if (toGenerate.length === 0) {
      toast.warning("Selecione pelo menos um cliente.");
      return;
    }

    // Validate courtesy reasons
    for (const client of toGenerate) {
      const courtesy = courtesyMap[client.id];
      if (courtesy?.enabled && !courtesy.reason.trim()) {
        toast.warning(`Preencha o motivo da cortesia para ${client.name}.`);
        return;
      }
      const partial = partialMap[client.id];
      if (partial?.enabled) {
        if (partial.value <= 0) {
          toast.warning(`Informe o valor parcial para ${client.name}.`);
          return;
        }
        if (partial.value >= client.monthly_value_final) {
          toast.warning(`O valor parcial de ${client.name} deve ser menor que a mensalidade integral.`);
          return;
        }
      }
    }

    setGenerating(true);
    let success = 0;
    let errors = 0;

    for (const client of toGenerate) {
      const isCourtesy = courtesyMap[client.id]?.enabled || false;
      const isPartial = partialMap[client.id]?.enabled || false;
      const partialValue = partialMap[client.id]?.value || 0;

      const valorOriginal = isCourtesy ? 0 : isPartial ? partialValue : client.monthly_value_final;
      const descSuffix = isCourtesy ? " (Cortesia)" : isPartial ? " (Parcial)" : "";
      const cReason = courtesyMap[client.id]?.reason || "";
      const obs = isCourtesy
        ? `Cortesia: ${cReason}`
        : isPartial
          ? `Mensalidade parcial (valor integral: ${client.monthly_value_final.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})`
          : "";

      const ok = await addTitulo({
        tipo: "receber",
        origem: "mensalidade",
        clienteId: client.id,
        fornecedorNome: null,
        descricao: `Mensalidade ${MONTH_NAMES[selectedMonth - 1]}/${selectedYear} - ${client.name}${descSuffix}`,
        categoriaPlanoContasId: "",
        competenciaMes: competency,
        dataEmissao: format(new Date(), "yyyy-MM-dd"),
        vencimento: calcDueDate(client.default_due_day),
        valorOriginal,
        desconto: 0,
        juros: 0,
        multa: 0,
        status: isCourtesy ? "pago" : "aberto",
        formaPagamento: "boleto",
        contaBancariaId: null,
        anexosFake: [],
        observacoes: obs,
        commissionType: null,
        isCourtesy,
        courtesyReason: isCourtesy ? cReason : null,
      } as any);
      if (ok) success++; else errors++;
    }

    setGenerating(false);

    if (success > 0) {
      toast.success(`${success} mensalidade(s) gerada(s) com sucesso!`);
      setAlreadyGenerated((prev) => {
        const next = new Set(prev);
        clients.filter((c) => selectedIds.has(c.id)).forEach((c) => next.add(c.id));
        return next;
      });
      setSelectedIds(new Set());
      setCourtesyMap({});
      setPartialMap({});
    }
    if (errors > 0) {
      toast.error(`${errors} mensalidade(s) falharam ao gerar.`);
    }
  }

  const totalSelected = clients
    .filter((c) => selectedIds.has(c.id))
    .reduce((sum, c) => {
      const isCourtesy = courtesyMap[c.id]?.enabled || false;
      const isPartial = partialMap[c.id]?.enabled || false;
      const partialValue = partialMap[c.id]?.value || 0;
      return sum + (isCourtesy ? 0 : isPartial ? partialValue : c.monthly_value_final);
    }, 0);

  const courtesyCount = clients.filter((c) => selectedIds.has(c.id) && courtesyMap[c.id]?.enabled).length;
  const partialCount = clients.filter((c) => selectedIds.has(c.id) && partialMap[c.id]?.enabled).length;

  const yearOptions = [selectedYear - 1, selectedYear, selectedYear + 1];

  return (
    <div className="space-y-6">
      <PageHeader title="Gerar Mensalidades" subtitle="Geração em lote de títulos de contas a receber" />

      {/* Filters */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            Competência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Mês</label>
              <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((name, i) => (
                    <SelectItem key={i} value={String(i + 1)}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Ano</label>
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client table */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Clientes Ativos com Recorrência
              {!loading && (
                <Badge variant="secondary" className="ml-2">
                  {clients.length} cliente(s)
                </Badge>
              )}
            </CardTitle>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} selecionado(s)
                  {courtesyCount > 0 && (
                    <span className="text-amber-400 ml-1">({courtesyCount} cortesia)</span>
                  )}
                  {" · Total: "}
                  <span className="text-foreground font-semibold">
                    {totalSelected.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </span>
                <Button onClick={handleGenerate} disabled={generating} size="sm">
                  {generating ? (
                    <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Gerando...</>
                  ) : (
                    <><Receipt className="h-4 w-4 mr-1" />Gerar Mensalidades</>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : clients.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum cliente ativo com recorrência encontrado.
            </div>
          ) : (
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleAll}
                        disabled={selectableClients.length === 0}
                      />
                    </TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Mensalidade</TableHead>
                    <TableHead className="text-center">Dia Venc.</TableHead>
                    <TableHead className="text-center">Vencimento</TableHead>
                    <TableHead className="text-center">Cortesia</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((c) => {
                    const generated = alreadyGenerated.has(c.id);
                    const dueDate = calcDueDate(c.default_due_day);
                    const courtesy = courtesyMap[c.id];
                    const isCourtesy = courtesy?.enabled || false;
                    return (
                      <>
                        <TableRow key={c.id} className={generated ? "opacity-50" : ""}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(c.id)}
                              onCheckedChange={() => toggleOne(c.id)}
                              disabled={generated}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell className="text-right font-mono">
                            {isCourtesy ? (
                              <span className="text-muted-foreground line-through">
                                {c.monthly_value_final.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </span>
                            ) : (
                              c.monthly_value_final.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                            )}
                          </TableCell>
                          <TableCell className="text-center">{c.default_due_day || 10}</TableCell>
                          <TableCell className="text-center text-sm">
                            {format(new Date(dueDate + "T12:00:00"), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={isCourtesy}
                              onCheckedChange={(checked) => toggleCourtesy(c.id, checked)}
                              disabled={generated}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            {generated ? (
                              <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
                                Já gerado
                              </Badge>
                            ) : isCourtesy ? (
                              <Badge variant="outline" className="text-amber-400 border-amber-500/30">
                                <Gift className="h-3 w-3 mr-1" />
                                Cortesia
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                Pendente
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                        {isCourtesy && !generated && (
                          <TableRow key={`${c.id}-reason`}>
                            <TableCell />
                            <TableCell colSpan={6}>
                              <div className="flex items-center gap-2 pb-1">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">Motivo:</span>
                                <Input
                                  placeholder="Ex: Cortesia, bonificação, período de testes..."
                                  value={courtesy?.reason || ""}
                                  onChange={(e) => setCourtesyReason(c.id, e.target.value)}
                                  className="h-8 text-sm max-w-md"
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
