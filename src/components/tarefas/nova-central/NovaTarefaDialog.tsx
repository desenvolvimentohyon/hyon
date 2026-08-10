import React, { useState, useEffect } from "react";
import { Prioridade, TipoOperacional } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Monitor, Link2, X, ImagePlus } from "lucide-react";
import { TIPO_OPERACIONAL_CONFIG } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientes: any[];
  tecnicos: any[];
  tecnicoAtualId: string;
  addCliente: (c: any) => Promise<any> | any;
  addTarefa: (t: any) => Promise<any> | any;
  getPrioridadeLabel: (p: string) => string;
}

export function NovaTarefaDialog({ open, onOpenChange, clientes, tecnicos, tecnicoAtualId, addCliente, addTarefa, getPrioridadeLabel }: Props) {
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novoDesc, setNovoDesc] = useState("");
  const [novoCliente, setNovoCliente] = useState<string>("");
  const [novoResponsavel, setNovoResponsavel] = useState(tecnicoAtualId);
  const [novoPrioridade, setNovoPrioridade] = useState<Prioridade>("media");
  const [novoPrazo, setNovoPrazo] = useState("");
  const [novoTags, setNovoTags] = useState("");
  const [novoTipo, setNovoTipo] = useState<TipoOperacional>("interno");
  const [novoSistema, setNovoSistema] = useState<string | undefined>(undefined);
  const [sistemaDetectado, setSistemaDetectado] = useState<string | null>(null);
  const [novoObservacoes, setNovoObservacoes] = useState("");
  const [novoClienteNome, setNovoClienteNome] = useState("");
  const [novoClienteTelefone, setNovoClienteTelefone] = useState("");
  const [novoClienteEmail, setNovoClienteEmail] = useState("");
  const [novoClienteCidade, setNovoClienteCidade] = useState("");
  const [fotosFiles, setFotosFiles] = useState<File[]>([]);
  const [fotosPreview, setFotosPreview] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setSistemaDetectado(null);
    setNovoSistema(undefined);
    if (!novoCliente || novoCliente === "novo" || novoCliente === "null") return;
    supabase.from("clients").select("system_name").eq("id", novoCliente).single()
      .then(({ data }) => {
        if (data?.system_name) setSistemaDetectado(data.system_name);
      });
  }, [novoCliente]);

  const handleFotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setFotosFiles(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setFotosPreview(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeFoto = (idx: number) => {
    setFotosFiles(prev => prev.filter((_, i) => i !== idx));
    setFotosPreview(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCriar = async () => {
    if (!novoTitulo.trim()) { toast({ title: "Título obrigatório", variant: "destructive" }); return; }
    if (novoCliente === "novo" && !novoClienteNome.trim()) { toast({ title: "Nome do novo cliente é obrigatório", variant: "destructive" }); return; }
    setUploading(true);

    let clienteIdFinal: string | null = null;
    if (novoCliente === "novo") {
      await addCliente({
        nome: novoClienteNome.trim(),
        telefone: novoClienteTelefone.trim() || undefined,
        email: novoClienteEmail.trim() || undefined,
      });
      const { data: newClients } = await supabase.from("clients").select("id").eq("name", novoClienteNome.trim()).order("created_at", { ascending: false }).limit(1);
      clienteIdFinal = newClients?.[0]?.id || null;
      if (clienteIdFinal && novoClienteCidade.trim()) {
        await supabase.from("clients").update({ city: novoClienteCidade.trim() }).eq("id", clienteIdFinal);
      }
    } else {
      clienteIdFinal = novoCliente === "" ? null : novoCliente;
    }

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const orgId = currentUser ? (await supabase.from("profiles").select("org_id").eq("id", currentUser.id).single()).data?.org_id : null;
    const fotosArr: { id: string; url: string; nome: string }[] = [];
    if (orgId && fotosFiles.length > 0) {
      for (const file of fotosFiles) {
        const fileId = Math.random().toString(36).slice(2);
        const filePath = `${orgId}/${fileId}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("task-attachments").upload(filePath, file);
        if (!upErr) {
          fotosArr.push({ id: fileId, url: filePath, nome: file.name });
        }
      }
    }

    addTarefa({
      titulo: novoTitulo.trim(), descricao: novoDesc,
      clienteId: clienteIdFinal,
      nomeClienteAvulso: undefined,
      responsavelId: novoResponsavel, prioridade: novoPrioridade, status: "a_fazer",
      prazoDataHora: novoPrazo || undefined,
      tags: novoTags.split(",").map(t => t.trim()).filter(Boolean),
      checklist: [], anexosFake: [], comentarios: [],
      tipoOperacional: novoTipo,
      sistemaRelacionado: novoSistema || undefined,
      observacoes: novoObservacoes.trim() || undefined,
      fotos: fotosArr.length > 0 ? fotosArr : undefined,
    });
    toast({ title: "Tarefa criada com sucesso!" });
    onOpenChange(false);
    setNovoTitulo(""); setNovoDesc(""); setNovoCliente(""); setNovoPrazo(""); setNovoTags("");
    setNovoSistema(undefined); setSistemaDetectado(null);
    setNovoObservacoes(""); setFotosFiles([]); setFotosPreview([]);
    setNovoClienteNome(""); setNovoClienteTelefone(""); setNovoClienteEmail(""); setNovoClienteCidade("");
    setUploading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
        <div className="space-y-3 max-h-[80vh] overflow-y-auto pr-1">
          <div><Label>Título *</Label><Input value={novoTitulo} onChange={e => setNovoTitulo(e.target.value)} placeholder="Ex: Configurar servidor" /></div>
          <div><Label>Descrição</Label><Textarea value={novoDesc} onChange={e => setNovoDesc(e.target.value)} rows={2} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo Operacional</Label>
              <Select value={novoTipo} onValueChange={v => setNovoTipo(v as TipoOperacional)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TIPO_OPERACIONAL_CONFIG) as TipoOperacional[]).map(t => (
                    <SelectItem key={t} value={t}>{TIPO_OPERACIONAL_CONFIG[t].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cliente</Label>
              <Select value={novoCliente} onValueChange={v => { setNovoCliente(v); if (v !== "novo") { setNovoClienteNome(""); setNovoClienteTelefone(""); setNovoClienteEmail(""); setNovoClienteCidade(""); } }}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="novo">➕ Cadastrar novo cliente</SelectItem>
                  {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
              {novoCliente === "novo" && (
                <div className="mt-2 space-y-2 rounded-md border border-border/60 p-3 bg-muted/30">
                  <div><Input placeholder="Nome do cliente *" value={novoClienteNome} onChange={e => setNovoClienteNome(e.target.value)} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Telefone" value={novoClienteTelefone} onChange={e => setNovoClienteTelefone(e.target.value)} />
                    <Input placeholder="Email" type="email" value={novoClienteEmail} onChange={e => setNovoClienteEmail(e.target.value)} />
                  </div>
                  <Input placeholder="Cidade" value={novoClienteCidade} onChange={e => setNovoClienteCidade(e.target.value)} />
                </div>
              )}
            </div>
          </div>
          {sistemaDetectado && !novoSistema && (
            <Alert className="border-info/30 bg-info/5">
              <Monitor className="h-4 w-4 text-info" />
              <AlertDescription className="flex items-center justify-between gap-2">
                <span className="text-sm">Este cliente usa <strong>{sistemaDetectado}</strong>. Deseja vincular à tarefa?</span>
                <Button size="sm" variant="outline" className="shrink-0 gap-1.5 h-7 text-xs" onClick={() => setNovoSistema(sistemaDetectado)}>
                  <Link2 className="h-3 w-3" />Vincular
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {novoSistema && (
            <div className="flex items-center gap-2">
              <Badge variant="info" className="gap-1">
                <Monitor className="h-3 w-3" />{novoSistema}
              </Badge>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setNovoSistema(undefined)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Responsável</Label>
              <Select value={novoResponsavel} onValueChange={setNovoResponsavel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{tecnicos.filter(t => t.ativo).map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={novoPrioridade} onValueChange={v => setNovoPrioridade(v as Prioridade)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["baixa", "media", "alta", "urgente"] as Prioridade[]).map(p => <SelectItem key={p} value={p}>{getPrioridadeLabel(p)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Prazo</Label><Input type="datetime-local" value={novoPrazo} onChange={e => setNovoPrazo(e.target.value)} /></div>
            <div><Label>Tags (vírgula)</Label><Input value={novoTags} onChange={e => setNovoTags(e.target.value)} placeholder="rede, hardware" /></div>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={novoObservacoes} onChange={e => setNovoObservacoes(e.target.value)} rows={2} placeholder="Anotações adicionais..." />
          </div>
          <div>
            <Label>Fotos</Label>
            <div className="flex items-center gap-2 mt-1">
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-dashed border-muted-foreground/30 cursor-pointer hover:bg-accent/50 transition-colors text-sm text-muted-foreground">
                <ImagePlus className="h-4 w-4" />
                Adicionar fotos
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFotoSelect} />
              </label>
            </div>
            {fotosPreview.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {fotosPreview.map((src, idx) => (
                  <div key={idx} className="relative group">
                    <img src={src} alt={`Foto ${idx + 1}`} className="h-16 w-16 rounded-md object-cover border" />
                    <button type="button" onClick={() => removeFoto(idx)} className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleCriar} disabled={uploading}>{uploading ? "Enviando..." : "Criar Tarefa"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
