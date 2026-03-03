import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, CheckCircle, Clock, Copy, ExternalLink, FileText, Shield, User } from "lucide-react";
import { toast } from "sonner";
import logoHyon from "@/assets/logo-hyon.png";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";

interface PortalData {
  client: {
    name: string;
    document: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    system_name: string | null;
    status: string;
    monthly_value_final: number;
    contract_signed_at: string | null;
    adjustment_base_date: string | null;
    adjustment_type: string | null;
    adjustment_percent: number;
    cert_expires_at: string | null;
    cert_issuer: string | null;
    cert_serial: string | null;
  };
  plan: { name: string; discount_percent: number } | null;
  titles: {
    id: string;
    description: string;
    value_original: number;
    value_final: number;
    due_at: string | null;
    status: string;
    competency: string | null;
    asaas_bank_slip_url: string | null;
    asaas_pix_payload: string | null;
    asaas_pix_qr_code: string | null;
    asaas_invoice_url: string | null;
  }[];
  org_name: string;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  aberto: { label: "Pendente", variant: "outline" },
  pago: { label: "Pago", variant: "default" },
  vencido: { label: "Vencido", variant: "destructive" },
  parcial: { label: "Parcial", variant: "secondary" },
  cancelado: { label: "Cancelado", variant: "secondary" },
};

export default function PortalCliente() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    fetch(`https://${projectId}.supabase.co/functions/v1/portal-data?token=${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Token inválido");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-lg p-8">
          <Skeleton className="h-12 w-48 mx-auto" />
          <Skeleton className="h-6 w-64 mx-auto" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Link inválido</h2>
            <p className="text-muted-foreground">Este link de acesso ao portal não é válido ou expirou. Solicite um novo link ao seu fornecedor.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { client, plan, titles, org_name } = data;

  // Certificate days remaining
  const certDaysRemaining = client.cert_expires_at
    ? Math.ceil((new Date(client.cert_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const adjustmentTypeLabel: Record<string, string> = {
    percentual_fixo: "Percentual Fixo",
    ipca: "IPCA",
    igpm: "IGPM",
  };

  const handleCopyPix = (payload: string) => {
    navigator.clipboard.writeText(payload);
    toast.success("Código PIX copiado!");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoHyon} alt="Hyon Tech" className="h-10 w-auto" />
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Portal do Cliente</p>
            <p className="text-xs text-muted-foreground">{org_name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Client info header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{client.name}</h1>
                  <p className="text-sm text-muted-foreground">{client.document || "—"}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={client.status === "ativo" ? "default" : "destructive"}>
                  {client.status === "ativo" ? "Ativo" : client.status}
                </Badge>
                {client.system_name && <Badge variant="secondary">{client.system_name}</Badge>}
                {plan && <Badge variant="outline">{plan.name}</Badge>}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-sm">
              <div><span className="text-muted-foreground">Email</span><p className="font-medium">{client.email || "—"}</p></div>
              <div><span className="text-muted-foreground">Telefone</span><p className="font-medium">{client.phone || "—"}</p></div>
              <div><span className="text-muted-foreground">Cidade</span><p className="font-medium">{client.city || "—"}</p></div>
              <div><span className="text-muted-foreground">Mensalidade</span><p className="font-medium text-primary">{fmt(client.monthly_value_final)}</p></div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="financeiro" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="contrato">Contrato</TabsTrigger>
            <TabsTrigger value="certificado">Certificado</TabsTrigger>
          </TabsList>

          {/* Financeiro */}
          <TabsContent value="financeiro" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Mensalidades</CardTitle></CardHeader>
              <CardContent>
                {titles.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">Nenhuma mensalidade encontrada.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Competência</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Vencimento</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {titles.map((t) => {
                          const s = STATUS_MAP[t.status] || { label: t.status, variant: "outline" as const };
                          return (
                            <TableRow key={t.id}>
                              <TableCell className="text-sm">{t.competency || "—"}</TableCell>
                              <TableCell className="text-sm max-w-[200px] truncate">{t.description}</TableCell>
                              <TableCell className="text-sm">{fmtDate(t.due_at)}</TableCell>
                              <TableCell className="text-right text-sm font-medium">{fmt(t.value_final || t.value_original)}</TableCell>
                              <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {t.asaas_bank_slip_url && (
                                    <Button size="sm" variant="outline" asChild>
                                      <a href={t.asaas_bank_slip_url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-3 w-3 mr-1" /> Boleto
                                      </a>
                                    </Button>
                                  )}
                                  {t.asaas_pix_payload && (
                                    <Button size="sm" variant="outline" onClick={() => handleCopyPix(t.asaas_pix_payload!)}>
                                      <Copy className="h-3 w-3 mr-1" /> PIX
                                    </Button>
                                  )}
                                  {t.asaas_invoice_url && (
                                    <Button size="sm" variant="outline" asChild>
                                      <a href={t.asaas_invoice_url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-3 w-3 mr-1" /> Fatura
                                      </a>
                                    </Button>
                                  )}
                                </div>
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
          </TabsContent>

          {/* Contrato */}
          <TabsContent value="contrato" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Dados do Contrato</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div><span className="text-sm text-muted-foreground">Data de Assinatura</span><p className="font-medium">{fmtDate(client.contract_signed_at)}</p></div>
                    <div><span className="text-sm text-muted-foreground">Sistema Contratado</span><p className="font-medium">{client.system_name || "—"}</p></div>
                    <div><span className="text-sm text-muted-foreground">Plano</span><p className="font-medium">{plan?.name || "—"}{plan?.discount_percent ? ` (${plan.discount_percent}% desc.)` : ""}</p></div>
                  </div>
                  <div className="space-y-3">
                    <div><span className="text-sm text-muted-foreground">Valor Mensal</span><p className="font-medium text-primary text-lg">{fmt(client.monthly_value_final)}</p></div>
                    <div><span className="text-sm text-muted-foreground">Data Base de Reajuste</span><p className="font-medium">{fmtDate(client.adjustment_base_date)}</p></div>
                    <div><span className="text-sm text-muted-foreground">Tipo de Reajuste</span><p className="font-medium">{client.adjustment_type ? `${adjustmentTypeLabel[client.adjustment_type] || client.adjustment_type} (${client.adjustment_percent}%)` : "Não definido"}</p></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certificado Digital */}
          <TabsContent value="certificado" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" /> Certificado Digital</CardTitle></CardHeader>
              <CardContent>
                {!client.cert_expires_at ? (
                  <p className="text-muted-foreground text-sm text-center py-8">Nenhum certificado digital cadastrado.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div><span className="text-sm text-muted-foreground">Emissor</span><p className="font-medium">{client.cert_issuer || "—"}</p></div>
                      <div><span className="text-sm text-muted-foreground">Serial</span><p className="font-medium text-xs font-mono">{client.cert_serial || "—"}</p></div>
                      <div><span className="text-sm text-muted-foreground">Validade</span><p className="font-medium">{fmtDate(client.cert_expires_at)}</p></div>
                    </div>

                    {certDaysRemaining !== null && (
                      <div className={`rounded-lg p-4 flex items-center gap-3 ${
                        certDaysRemaining <= 0 ? "bg-destructive/10 text-destructive" :
                        certDaysRemaining <= 15 ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" :
                        certDaysRemaining <= 30 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" :
                        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      }`}>
                        {certDaysRemaining <= 0 ? (
                          <><AlertTriangle className="h-5 w-5" /><span className="font-medium">Certificado vencido há {Math.abs(certDaysRemaining)} dias</span></>
                        ) : certDaysRemaining <= 15 ? (
                          <><Clock className="h-5 w-5" /><span className="font-medium">Vence em {certDaysRemaining} dias — Renove o quanto antes!</span></>
                        ) : (
                          <><CheckCircle className="h-5 w-5" /><span className="font-medium">{certDaysRemaining} dias restantes</span></>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t py-4 mt-8">
        <p className="text-center text-xs text-muted-foreground">© {new Date().getFullYear()} {org_name} • Portal do Cliente</p>
      </footer>
    </div>
  );
}
