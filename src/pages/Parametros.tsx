import { useState } from "react";
import { useParametros } from "@/contexts/ParametrosContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Settings2, Monitor, Puzzle, CreditCard, Tag, Plus, Pencil, Trash2, Percent, AlertTriangle } from "lucide-react";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Parametros() {
  const {
    sistemas, modulos, formasPagamento, planos, alertaCertificadoDias,
    addSistema, updateSistema, deleteSistema,
    addModulo, updateModulo, deleteModulo,
    addFormaPagamento, updateFormaPagamento, deleteFormaPagamento,
    addPlano, updatePlano, deletePlano,
    setAlertaCertificadoDias,
  } = useParametros();

  // Generic modal state
  const [modal, setModal] = useState<{ type: string; editing: string | null } | null>(null);

  // Sistema form
  const [fSistema, setFSistema] = useState({ nome: "", descricao: "", valorCusto: 0, valorVenda: 0, ativo: true });
  // Modulo form
  const [fModulo, setFModulo] = useState({ nome: "", descricao: "", valorCusto: 0, valorVenda: 0, ativo: true, sistemaId: "" });
  // Forma form
  const [fForma, setFForma] = useState({ nome: "", ativo: true, observacao: "" });
  // Plano form
  const [fPlano, setFPlano] = useState({ nomePlano: "", descontoPercentual: 0, validadeMeses: 1, ativo: true });
  // Alerta
  const [alertaDias, setAlertaDias] = useState(alertaCertificadoDias);

  const openNewSistema = () => { setFSistema({ nome: "", descricao: "", valorCusto: 0, valorVenda: 0, ativo: true }); setModal({ type: "sistema", editing: null }); };
  const openEditSistema = (id: string) => { const s = sistemas.find(x => x.id === id); if (s) { setFSistema(s); setModal({ type: "sistema", editing: id }); } };
  const saveSistema = () => { if (!fSistema.nome.trim()) { toast.error("Nome obrigatório"); return; } modal?.editing ? updateSistema(modal.editing, fSistema) : addSistema(fSistema); setModal(null); toast.success("Sistema salvo!"); };

  const openNewModulo = () => { setFModulo({ nome: "", descricao: "", valorCusto: 0, valorVenda: 0, ativo: true, sistemaId: "" }); setModal({ type: "modulo", editing: null }); };
  const openEditModulo = (id: string) => { const m = modulos.find(x => x.id === id); if (m) { setFModulo({ ...m, sistemaId: m.sistemaId || "" }); setModal({ type: "modulo", editing: id }); } };
  const saveModulo = () => { if (!fModulo.nome.trim()) { toast.error("Nome obrigatório"); return; } modal?.editing ? updateModulo(modal.editing, fModulo) : addModulo(fModulo); setModal(null); toast.success("Módulo salvo!"); };

  const openNewForma = () => { setFForma({ nome: "", ativo: true, observacao: "" }); setModal({ type: "forma", editing: null }); };
  const openEditForma = (id: string) => { const f = formasPagamento.find(x => x.id === id); if (f) { setFForma({ nome: f.nome, ativo: f.ativo, observacao: f.observacao || "" }); setModal({ type: "forma", editing: id }); } };
  const saveForma = () => { if (!fForma.nome.trim()) { toast.error("Nome obrigatório"); return; } modal?.editing ? updateFormaPagamento(modal.editing, fForma) : addFormaPagamento(fForma); setModal(null); toast.success("Forma de pagamento salva!"); };

  const openNewPlano = () => { setFPlano({ nomePlano: "", descontoPercentual: 0, validadeMeses: 1, ativo: true }); setModal({ type: "plano", editing: null }); };
  const openEditPlano = (id: string) => { const p = planos.find(x => x.id === id); if (p) { setFPlano(p); setModal({ type: "plano", editing: id }); } };
  const savePlano = () => { if (!fPlano.nomePlano.trim()) { toast.error("Nome obrigatório"); return; } modal?.editing ? updatePlano(modal.editing, fPlano) : addPlano(fPlano); setModal(null); toast.success("Plano salvo!"); };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings2 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Parâmetros do Sistema</h1>
      </div>

      <Tabs defaultValue="sistemas">
        <TabsList className="flex-wrap">
          <TabsTrigger value="sistemas" className="gap-1.5"><Monitor className="h-3.5 w-3.5" />Sistemas</TabsTrigger>
          <TabsTrigger value="modulos" className="gap-1.5"><Puzzle className="h-3.5 w-3.5" />Módulos</TabsTrigger>
          <TabsTrigger value="pagamento" className="gap-1.5"><CreditCard className="h-3.5 w-3.5" />Formas de Pagamento</TabsTrigger>
          <TabsTrigger value="planos" className="gap-1.5"><Tag className="h-3.5 w-3.5" />Planos e Descontos</TabsTrigger>
          <TabsTrigger value="alertas" className="gap-1.5"><AlertTriangle className="h-3.5 w-3.5" />Alertas</TabsTrigger>
        </TabsList>

        {/* Sistemas */}
        <TabsContent value="sistemas" className="space-y-4">
          <div className="flex justify-end"><Button size="sm" onClick={openNewSistema} className="gap-1.5"><Plus className="h-4 w-4" />Novo Sistema</Button></div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Descrição</TableHead><TableHead className="text-right">Custo</TableHead><TableHead className="text-right">Venda</TableHead><TableHead>Status</TableHead><TableHead className="w-20">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {sistemas.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.descricao}</TableCell>
                    <TableCell className="text-right text-sm">{fmt(s.valorCusto)}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{fmt(s.valorVenda)}</TableCell>
                    <TableCell>{s.ativo ? <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}</TableCell>
                    <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditSistema(s.id)}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { deleteSistema(s.id); toast.success("Removido"); }}><Trash2 className="h-3.5 w-3.5" /></Button></div></TableCell>
                  </TableRow>
                ))}
                {sistemas.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum sistema cadastrado</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* Módulos */}
        <TabsContent value="modulos" className="space-y-4">
          <div className="flex justify-end"><Button size="sm" onClick={openNewModulo} className="gap-1.5"><Plus className="h-4 w-4" />Novo Módulo</Button></div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Sistema</TableHead><TableHead className="text-right">Custo</TableHead><TableHead className="text-right">Venda</TableHead><TableHead>Status</TableHead><TableHead className="w-20">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {modulos.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{sistemas.find(s => s.id === m.sistemaId)?.nome || "—"}</TableCell>
                    <TableCell className="text-right text-sm">{fmt(m.valorCusto)}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{fmt(m.valorVenda)}</TableCell>
                    <TableCell>{m.ativo ? <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}</TableCell>
                    <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditModulo(m.id)}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { deleteModulo(m.id); toast.success("Removido"); }}><Trash2 className="h-3.5 w-3.5" /></Button></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* Formas de Pagamento */}
        <TabsContent value="pagamento" className="space-y-4">
          <div className="flex justify-end"><Button size="sm" onClick={openNewForma} className="gap-1.5"><Plus className="h-4 w-4" />Nova Forma</Button></div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Observação</TableHead><TableHead>Status</TableHead><TableHead className="w-20">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {formasPagamento.map(f => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{f.observacao || "—"}</TableCell>
                    <TableCell>{f.ativo ? <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}</TableCell>
                    <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditForma(f.id)}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { deleteFormaPagamento(f.id); toast.success("Removido"); }}><Trash2 className="h-3.5 w-3.5" /></Button></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* Planos */}
        <TabsContent value="planos" className="space-y-4">
          <div className="flex justify-end"><Button size="sm" onClick={openNewPlano} className="gap-1.5"><Plus className="h-4 w-4" />Novo Plano</Button></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {planos.map(p => (
              <Card key={p.id} className={!p.ativo ? "opacity-50" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{p.nomePlano}</CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditPlano(p.id)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { deletePlano(p.id); toast.success("Removido"); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-primary" />
                      <span className="text-2xl font-bold">{p.descontoPercentual}%</span>
                      <span className="text-sm text-muted-foreground">de desconto</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{p.validadeMeses} {p.validadeMeses === 1 ? "mês" : "meses"} de vigência</div>
                    {p.ativo ? <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}
                    {p.descontoPercentual > 0 && (
                      <div className="text-xs text-muted-foreground mt-2 p-2 rounded border bg-muted/30">
                        Ex: R$ 200,00 → <span className="line-through">R$ 200,00</span> <span className="font-bold text-foreground">{fmt(200 * (1 - p.descontoPercentual / 100))}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alertas */}
        <TabsContent value="alertas" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Configuração de Alertas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-sm">
                <Label>Dias de antecedência para alerta de certificado digital</Label>
                <div className="flex gap-2 mt-1">
                  <Input type="number" value={alertaDias} onChange={e => setAlertaDias(Number(e.target.value))} className="h-9" />
                  <Button size="sm" onClick={() => { setAlertaCertificadoDias(alertaDias); toast.success("Alerta configurado!"); }}>Salvar</Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Certificados que vencem dentro deste período serão exibidos no dashboard.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Modais ── */}
      {/* Sistema */}
      <Dialog open={modal?.type === "sistema"} onOpenChange={() => setModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{modal?.editing ? "Editar Sistema" : "Novo Sistema"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome *</Label><Input value={fSistema.nome} onChange={e => setFSistema(p => ({ ...p, nome: e.target.value }))} /></div>
            <div><Label>Descrição</Label><Input value={fSistema.descricao} onChange={e => setFSistema(p => ({ ...p, descricao: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor Custo</Label><Input type="number" value={fSistema.valorCusto} onChange={e => setFSistema(p => ({ ...p, valorCusto: Number(e.target.value) }))} /></div>
              <div><Label>Valor Venda</Label><Input type="number" value={fSistema.valorVenda} onChange={e => setFSistema(p => ({ ...p, valorVenda: Number(e.target.value) }))} /></div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={fSistema.ativo} onCheckedChange={v => setFSistema(p => ({ ...p, ativo: v }))} /><Label>Ativo</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button><Button onClick={saveSistema}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Módulo */}
      <Dialog open={modal?.type === "modulo"} onOpenChange={() => setModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{modal?.editing ? "Editar Módulo" : "Novo Módulo"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome *</Label><Input value={fModulo.nome} onChange={e => setFModulo(p => ({ ...p, nome: e.target.value }))} /></div>
            <div><Label>Descrição</Label><Input value={fModulo.descricao} onChange={e => setFModulo(p => ({ ...p, descricao: e.target.value }))} /></div>
            <div><Label>Sistema vinculado</Label>
              <Select value={fModulo.sistemaId} onValueChange={v => setFModulo(p => ({ ...p, sistemaId: v }))}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {sistemas.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor Custo</Label><Input type="number" value={fModulo.valorCusto} onChange={e => setFModulo(p => ({ ...p, valorCusto: Number(e.target.value) }))} /></div>
              <div><Label>Valor Venda</Label><Input type="number" value={fModulo.valorVenda} onChange={e => setFModulo(p => ({ ...p, valorVenda: Number(e.target.value) }))} /></div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={fModulo.ativo} onCheckedChange={v => setFModulo(p => ({ ...p, ativo: v }))} /><Label>Ativo</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button><Button onClick={saveModulo}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Forma de Pagamento */}
      <Dialog open={modal?.type === "forma"} onOpenChange={() => setModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{modal?.editing ? "Editar Forma" : "Nova Forma de Pagamento"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome *</Label><Input value={fForma.nome} onChange={e => setFForma(p => ({ ...p, nome: e.target.value }))} /></div>
            <div><Label>Observação</Label><Input value={fForma.observacao} onChange={e => setFForma(p => ({ ...p, observacao: e.target.value }))} /></div>
            <div className="flex items-center gap-2"><Switch checked={fForma.ativo} onCheckedChange={v => setFForma(p => ({ ...p, ativo: v }))} /><Label>Ativo</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button><Button onClick={saveForma}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plano */}
      <Dialog open={modal?.type === "plano"} onOpenChange={() => setModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{modal?.editing ? "Editar Plano" : "Novo Plano"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome do Plano *</Label><Input value={fPlano.nomePlano} onChange={e => setFPlano(p => ({ ...p, nomePlano: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Desconto (%)</Label><Input type="number" value={fPlano.descontoPercentual} onChange={e => setFPlano(p => ({ ...p, descontoPercentual: Number(e.target.value) }))} /></div>
              <div><Label>Validade (meses)</Label><Input type="number" value={fPlano.validadeMeses} onChange={e => setFPlano(p => ({ ...p, validadeMeses: Number(e.target.value) }))} /></div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={fPlano.ativo} onCheckedChange={v => setFPlano(p => ({ ...p, ativo: v }))} /><Label>Ativo</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button><Button onClick={savePlano}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
