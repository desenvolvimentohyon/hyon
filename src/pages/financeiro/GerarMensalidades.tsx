import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFinanceiro } from "@/contexts/FinanceiroContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt, CalendarDays, Users, Loader2 } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const competency = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;

  // Fetch clients and check duplicates
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
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableClients.map((c) => c.id)));
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

    setGenerating(true);
    let success = 0;
    let errors = 0;

    for (const client of toGenerate) {
      const ok = await addTitulo({
        tipo: "receber",
        origem: "mensalidade",
        clienteId: client.id,
        fornecedorNome: null,
        descricao: `Mensalidade ${MONTH_NAMES[selectedMonth - 1]}/${selectedYear} - ${client.name}`,
        categoriaPlanoContasId: "",
        competenciaMes: competency,
        dataEmissao: format(new Date(), "yyyy-MM-dd"),
        vencimento: calcDueDate(client.default_due_day),
        valorOriginal: client.monthly_value_final,
        desconto: 0,
        juros: 0,
        multa: 0,
        status: "aberto",
        formaPagamento: "boleto",
        contaBancariaId: null,
        anexosFake: [],
        observacoes: "",
        commissionType: null,
      });
      if (ok) success++;
      else errors++;
    }

    setGenerating(false);

    if (success > 0) {
      toast.success(`${success} mensalidade(s) gerada(s) com sucesso!`);
      // Refresh duplicates
      setAlreadyGenerated((prev) => {
        const next = new Set(prev);
        clients.filter((c) => selectedIds.has(c.id)).forEach((c) => next.add(c.id));
        return next;
      });
      setSelectedIds(new Set());
    }
    if (errors > 0) {
      toast.error(`${errors} mensalidade(s) falharam ao gerar.`);
    }
  }

  const totalSelected = clients
    .filter((c) => selectedIds.has(c.id))
    .reduce((sum, c) => sum + c.monthly_value_final, 0);

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
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
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
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
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
          <div className="flex items-center justify-between">
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
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} selecionado(s) · Total:{" "}
                  <span className="text-foreground font-semibold">
                    {totalSelected.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </span>
                <Button onClick={handleGenerate} disabled={generating} size="sm">
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Receipt className="h-4 w-4 mr-1" />
                      Gerar Mensalidades
                    </>
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
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((c) => {
                    const generated = alreadyGenerated.has(c.id);
                    const dueDate = calcDueDate(c.default_due_day);
                    return (
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
                          {c.monthly_value_final.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </TableCell>
                        <TableCell className="text-center">
                          {c.default_due_day || 10}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {format(new Date(dueDate + "T12:00:00"), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="text-center">
                          {generated ? (
                            <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
                              Já gerado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Pendente
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
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
