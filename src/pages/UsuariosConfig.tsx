import { useState, useMemo } from "react";
import { useUsers } from "@/contexts/UsersContext";
import { MODULOS_PERMISSOES, ALL_PERMISSIONS } from "@/types/users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Users, Shield, Plus, Pencil, Trash2, Search, UserCheck, UserX, Save, RotateCcw, Lock } from "lucide-react";

export default function UsuariosConfig() {
  const { users, roles, addUser, updateUser, deleteUser, addRole, updateRole, deleteRole, getRole } = useUsers();

  const [tab, setTab] = useState("usuarios");
  const [busca, setBusca] = useState("");
  const [filtroRole, setFiltroRole] = useState("todos");
  const [filtroAtivo, setFiltroAtivo] = useState("todos");

  // User modal
  const [userModal, setUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [formUser, setFormUser] = useState({ nome: "", email: "", telefone: "", roleId: "", ativo: true, password: "", definirSenha: false });

  // Role modal
  const [roleModal, setRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [formRole, setFormRole] = useState({ nome: "", descricao: "", permissions: [] as string[] });
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Inline permission editing per role
  const [inlinePerms, setInlinePerms] = useState<Record<string, string[]>>({});
  const setInlinePermsFor = (roleId: string, perms: string[]) => {
    setInlinePerms(prev => ({ ...prev, [roleId]: perms }));
  };
  const resetInlinePerms = (roleId: string) => {
    setInlinePerms(prev => {
      const next = { ...prev };
      delete next[roleId];
      return next;
    });
  };
  const saveInlinePerms = async (roleId: string) => {
    const perms = inlinePerms[roleId];
    if (!perms) return;
    await updateRole(roleId, { permissions: perms });
    resetInlinePerms(roleId);
    toast.success("Permissões atualizadas!");
  };

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (busca && !u.nome.toLowerCase().includes(busca.toLowerCase()) && !u.email.toLowerCase().includes(busca.toLowerCase())) return false;
      if (filtroRole !== "todos" && u.roleId !== filtroRole) return false;
      if (filtroAtivo === "ativo" && !u.ativo) return false;
      if (filtroAtivo === "inativo" && u.ativo) return false;
      return true;
    });
  }, [users, busca, filtroRole, filtroAtivo]);

  const openNewUser = () => {
    setEditingUser(null);
    setFormUser({ nome: "", email: "", telefone: "", roleId: roles[0]?.id || "", ativo: true, password: "", definirSenha: false });
    setUserModal(true);
  };

  const openEditUser = (id: string) => {
    const u = users.find(x => x.id === id);
    if (!u) return;
    setEditingUser(id);
    setFormUser({ nome: u.nome, email: u.email, telefone: u.telefone || "", roleId: u.roleId, ativo: u.ativo, password: "", definirSenha: false });
    setUserModal(true);
  };

  const saveUser = async () => {
    if (!formUser.nome.trim() || !formUser.email.trim()) {
      toast.error("Nome e email são obrigatórios");
      return;
    }
    if (!editingUser && formUser.definirSenha) {
      if (!formUser.password || formUser.password.length < 6) {
        toast.error("A senha deve ter no mínimo 6 caracteres");
        return;
      }
    }
    try {
      if (editingUser) {
        await updateUser(editingUser, formUser);
        toast.success("Usuário atualizado!");
      } else {
        await addUser({
          ...formUser,
          password: formUser.definirSenha ? formUser.password : undefined,
        });
      }
      setUserModal(false);
    } catch {
      // erro já sinalizado via toast pelo context
    }
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
    let pwd = "";
    for (let i = 0; i < 12; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    setFormUser(p => ({ ...p, password: pwd, definirSenha: true }));
  };


  const openNewRole = () => {
    setEditingRole(null);
    setFormRole({ nome: "", descricao: "", permissions: [] });
    setRoleModal(true);
  };

  const openEditRole = (id: string) => {
    const r = roles.find(x => x.id === id);
    if (!r) return;
    setEditingRole(id);
    setFormRole({ nome: r.nome, descricao: r.descricao, permissions: [...r.permissions] });
    setRoleModal(true);
  };

  const saveRole = () => {
    if (!formRole.nome.trim()) {
      toast.error("Nome do perfil é obrigatório");
      return;
    }
    if (editingRole) {
      updateRole(editingRole, formRole);
      toast.success("Perfil atualizado!");
    } else {
      addRole(formRole);
      toast.success("Perfil criado!");
    }
    setRoleModal(false);
  };

  const togglePermission = (perm: string) => {
    setFormRole(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const toggleAllModule = (modulo: string) => {
    const acoes = MODULOS_PERMISSOES[modulo].acoes.map(a => a.id);
    const allChecked = acoes.every(a => formRole.permissions.includes(a));
    setFormRole(prev => ({
      ...prev,
      permissions: allChecked
        ? prev.permissions.filter(p => !acoes.includes(p))
        : [...new Set([...prev.permissions, ...acoes])],
    }));
  };

  const selectAllPermissions = () => {
    setFormRole(prev => ({ ...prev, permissions: [...ALL_PERMISSIONS] }));
  };

  const clearAllPermissions = () => {
    setFormRole(prev => ({ ...prev, permissions: [] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Usuários e Acessos</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="usuarios" className="gap-1.5"><Users className="h-3.5 w-3.5" />Usuários</TabsTrigger>
          <TabsTrigger value="perfis" className="gap-1.5"><Shield className="h-3.5 w-3.5" />Perfis de Acesso</TabsTrigger>
        </TabsList>

        {/* ── Usuários ── */}
        <TabsContent value="usuarios" className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou email..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={filtroRole} onValueChange={setFiltroRole}>
              <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Perfil" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os perfis</SelectItem>
                {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filtroAtivo} onValueChange={setFiltroAtivo}>
              <SelectTrigger className="w-[120px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={openNewUser} className="gap-1.5"><Plus className="h-4 w-4" />Novo Usuário</Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(u => {
                    const role = getRole(u.roleId);
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.nome}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                        <TableCell><Badge variant="outline">{role?.nome || "—"}</Badge></TableCell>
                        <TableCell>
                          {u.ativo
                            ? <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"><UserCheck className="h-3 w-3 mr-1" />Ativo</Badge>
                            : <Badge variant="secondary"><UserX className="h-3 w-3 mr-1" />Inativo</Badge>
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditUser(u.id)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setUserToDelete(u.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Perfis de Acesso ── */}
        <TabsContent value="perfis" className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground">
              Expanda um perfil para editar suas permissões diretamente. Perfis de sistema são somente leitura.
            </p>
            <Button size="sm" onClick={openNewRole} className="gap-1.5"><Plus className="h-4 w-4" />Novo Perfil</Button>
          </div>

          <Accordion type="multiple" className="space-y-2">
            {roles.map(r => {
              const usersCount = users.filter(u => u.roleId === r.id).length;
              const edited = inlinePerms[r.id] ?? r.permissions;
              const dirty = inlinePerms[r.id] !== undefined
                && (inlinePerms[r.id].length !== r.permissions.length
                  || inlinePerms[r.id].some(p => !r.permissions.includes(p)));
              return (
                <AccordionItem key={r.id} value={r.id} className="border rounded-lg bg-card px-3">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-3 flex-1 pr-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{r.nome}</span>
                          {r.sistema && <Badge variant="outline" className="text-[9px] gap-1"><Lock className="h-2.5 w-2.5" />Sistema</Badge>}
                          {dirty && <Badge className="text-[9px] bg-amber-500/15 text-amber-700 dark:text-amber-300">Alterações pendentes</Badge>}
                        </div>
                        {r.descricao && <p className="text-xs text-muted-foreground mt-0.5">{r.descricao}</p>}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary">{edited.length} permissões</Badge>
                        <Badge variant="outline">{usersCount} usuário(s)</Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-4">
                    <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={r.sistema} onClick={() => setInlinePermsFor(r.id, [...ALL_PERMISSIONS])}>
                          Marcar todas
                        </Button>
                        <Button variant="outline" size="sm" disabled={r.sistema} onClick={() => setInlinePermsFor(r.id, [])}>
                          Limpar
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        {!r.sistema && (
                          <>
                            <Button variant="ghost" size="sm" className="gap-1.5" disabled={!dirty} onClick={() => resetInlinePerms(r.id)}>
                              <RotateCcw className="h-3.5 w-3.5" />Descartar
                            </Button>
                            <Button size="sm" className="gap-1.5" disabled={!dirty} onClick={() => saveInlinePerms(r.id)}>
                              <Save className="h-3.5 w-3.5" />Salvar permissões
                            </Button>
                            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => openEditRole(r.id)}>
                              <Pencil className="h-3.5 w-3.5" />Nome / descrição
                            </Button>
                            <Button variant="ghost" size="sm" className="gap-1.5 text-destructive" onClick={() => setRoleToDelete(r.id)}>
                              <Trash2 className="h-3.5 w-3.5" />Excluir
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {Object.entries(MODULOS_PERMISSOES).map(([key, modulo]) => {
                        const acoesIds = modulo.acoes.map(a => a.id);
                        const marcadas = acoesIds.filter(a => edited.includes(a)).length;
                        const allChecked = marcadas === acoesIds.length;
                        return (
                          <div key={key} className="rounded-lg border p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Checkbox
                                checked={allChecked}
                                disabled={r.sistema}
                                onCheckedChange={() => {
                                  const next = allChecked
                                    ? edited.filter(p => !acoesIds.includes(p))
                                    : [...new Set([...edited, ...acoesIds])];
                                  setInlinePermsFor(r.id, next);
                                }}
                              />
                              <span className="font-medium text-sm">{modulo.label}</span>
                              <Badge variant="outline" className="text-[9px] ml-auto">
                                {marcadas}/{acoesIds.length}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 gap-1.5 pl-6">
                              {modulo.acoes.map(acao => {
                                const checked = edited.includes(acao.id);
                                return (
                                  <label key={acao.id} className={`flex items-center gap-2 text-xs ${r.sistema ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}>
                                    <Checkbox
                                      checked={checked}
                                      disabled={r.sistema}
                                      onCheckedChange={() => {
                                        const next = checked
                                          ? edited.filter(p => p !== acao.id)
                                          : [...edited, acao.id];
                                        setInlinePermsFor(r.id, next);
                                      }}
                                    />
                                    {acao.label}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </TabsContent>
      </Tabs>


      {/* ── Modal Usuário ── */}
      <Dialog open={userModal} onOpenChange={setUserModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={formUser.nome} onChange={e => setFormUser(p => ({ ...p, nome: e.target.value }))} />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={formUser.email} onChange={e => setFormUser(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={formUser.telefone} onChange={e => setFormUser(p => ({ ...p, telefone: e.target.value }))} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <Label>Perfil de Acesso</Label>
              <Select value={formUser.roleId} onValueChange={v => setFormUser(p => ({ ...p, roleId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {!editingUser && (
              <div className="rounded-lg border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formUser.definirSenha}
                      onCheckedChange={v => setFormUser(p => ({ ...p, definirSenha: v, password: v ? p.password : "" }))}
                    />
                    <Label className="cursor-pointer">Definir senha agora</Label>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formUser.definirSenha ? "Usuário já acessa sem confirmar e-mail" : "Convite será enviado por e-mail"}
                  </span>
                </div>
                {formUser.definirSenha && (
                  <div>
                    <Label>Senha *</Label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={formUser.password}
                        onChange={e => setFormUser(p => ({ ...p, password: e.target.value }))}
                        placeholder="Mínimo 6 caracteres"
                      />
                      <Button type="button" variant="outline" onClick={generatePassword}>Gerar</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch checked={formUser.ativo} onCheckedChange={v => setFormUser(p => ({ ...p, ativo: v }))} />
              <Label>Usuário ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserModal(false)}>Cancelar</Button>
            <Button onClick={saveUser}>{editingUser ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Perfil ── */}
      <Dialog open={roleModal} onOpenChange={setRoleModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingRole ? "Editar Perfil" : "Novo Perfil"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome do Perfil *</Label>
                <Input value={formRole.nome} onChange={e => setFormRole(p => ({ ...p, nome: e.target.value }))} />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input value={formRole.descricao} onChange={e => setFormRole(p => ({ ...p, descricao: e.target.value }))} />
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">Matriz de Permissões</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllPermissions}>Marcar Todas</Button>
                  <Button variant="outline" size="sm" onClick={clearAllPermissions}>Limpar Todas</Button>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(MODULOS_PERMISSOES).map(([key, modulo]) => {
                  const allChecked = modulo.acoes.every(a => formRole.permissions.includes(a.id));
                  const someChecked = modulo.acoes.some(a => formRole.permissions.includes(a.id));
                  return (
                    <div key={key} className="rounded-lg border p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Checkbox
                          checked={allChecked}
                          // @ts-ignore
                          indeterminate={someChecked && !allChecked}
                          onCheckedChange={() => toggleAllModule(key)}
                        />
                        <span className="font-medium text-sm">{modulo.label}</span>
                        <Badge variant="outline" className="text-[9px] ml-auto">
                          {modulo.acoes.filter(a => formRole.permissions.includes(a.id)).length}/{modulo.acoes.length}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pl-6">
                        {modulo.acoes.map(acao => (
                          <label key={acao.id} className="flex items-center gap-2 text-sm cursor-pointer">
                            <Checkbox
                              checked={formRole.permissions.includes(acao.id)}
                              onCheckedChange={() => togglePermission(acao.id)}
                            />
                            {acao.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleModal(false)}>Cancelar</Button>
            <Button onClick={saveRole}>{editingRole ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirmar exclusão de perfil ── */}
      <AlertDialog open={!!roleToDelete} onOpenChange={(o) => !o && setRoleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir perfil de acesso?</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const r = roles.find(x => x.id === roleToDelete);
                const count = users.filter(u => u.roleId === roleToDelete).length;
                return (
                  <>
                    Esta ação removerá o perfil <strong>{r?.nome}</strong> permanentemente.
                    {count > 0 && (
                      <> Existem <strong>{count}</strong> usuário(s) vinculado(s) a este perfil — reatribua-os antes de excluir.</>
                    )}
                  </>
                );
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (roleToDelete) {
                  const count = users.filter(u => u.roleId === roleToDelete).length;
                  if (count > 0) {
                    toast.error("Reatribua os usuários antes de excluir este perfil.");
                  } else {
                    deleteRole(roleToDelete);
                    toast.success("Perfil removido");
                  }
                }
                setRoleToDelete(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Confirmar exclusão de usuário ── */}
      <AlertDialog open={!!userToDelete} onOpenChange={(o) => !o && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              O usuário será desativado e perderá acesso ao sistema. Você pode reativá-lo depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (userToDelete) deleteUser(userToDelete);
                setUserToDelete(null);
              }}
            >
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
