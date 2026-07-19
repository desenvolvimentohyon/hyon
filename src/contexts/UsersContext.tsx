import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Role, AppUser, ALL_PERMISSIONS } from "@/types/users";

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [...ALL_PERMISSIONS],
  financeiro: [
    "financeiro:visualizar", "financeiro:lancar", "financeiro:conciliar",
    "financeiro:editar-plano-contas", "financeiro:relatorios",
    "clientes:visualizar", "tarefas:visualizar", "configuracoes:visualizar",
  ],
  comercial: [
    "propostas:visualizar", "propostas:criar", "propostas:editar",
    "propostas:enviar", "propostas:baixar-pdf", "propostas:aprovar",
    "clientes:visualizar", "clientes:criar", "clientes:editar",
    "tarefas:visualizar", "tarefas:criar", "tarefas:editar", "configuracoes:visualizar",
  ],
  suporte: [
    "tarefas:visualizar", "tarefas:criar", "tarefas:editar",
    "tarefas:atribuir", "tarefas:encerrar",
    "clientes:visualizar", "configuracoes:visualizar",
  ],
  implantacao: [
    "tarefas:visualizar", "tarefas:criar", "tarefas:editar",
    "tarefas:atribuir", "tarefas:encerrar",
    "clientes:visualizar", "configuracoes:visualizar",
  ],
  leitura: [
    "clientes:visualizar", "propostas:visualizar", "financeiro:visualizar",
    "tarefas:visualizar", "configuracoes:visualizar",
  ],
};

function dbToRole(r: any): Role {
  return {
    id: r.id, nome: r.name, descricao: r.description,
    permissions: r.permissions || [], sistema: r.is_system,
  };
}

function dbToUser(r: any): AppUser {
  return {
    id: r.id, nome: r.full_name, email: r.email || "",
    telefone: r.phone || undefined,
    ativo: r.is_active, roleId: r.custom_role_id || r.role,
    criadoEm: r.created_at, atualizadoEm: r.updated_at,
  };
}

async function getFunctionErrorMessage(error: unknown, fallback: string) {
  const baseMessage = error instanceof Error ? error.message : fallback;
  const maybeContext = (error as { context?: unknown })?.context;

  if (maybeContext instanceof Response) {
    try {
      const body = await maybeContext.clone().json() as { error?: string; message?: string };
      return body.error || body.message || baseMessage;
    } catch {
      return baseMessage;
    }
  }

  return baseMessage;
}

interface UsersState {
  users: AppUser[];
  roles: Role[];
  currentUserId: string;
  loading: boolean;
}

interface UsersContextType extends UsersState {
  addUser: (u: Omit<AppUser, "id" | "criadoEm" | "atualizadoEm"> & { password?: string }) => Promise<void>;
  updateUser: (id: string, changes: Partial<AppUser>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  setCurrentUser: (id: string) => void;
  getUser: (id: string) => AppUser | undefined;
  getCurrentUser: () => AppUser | undefined;
  addRole: (r: Omit<Role, "id" | "sistema">) => void;
  updateRole: (id: string, changes: Partial<Role>) => void;
  deleteRole: (id: string) => void;
  getRole: (id: string) => Role | undefined;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  getCurrentPermissions: () => string[];
  resetUsers: () => void;
}

const UsersContext = createContext<UsersContextType | null>(null);

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const { profile, user } = useAuth();
  const orgId = profile?.org_id;

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const initialLoadedRef = useRef(false);

  useEffect(() => {
    if (user?.id) setCurrentUserId(user.id);
  }, [user?.id]);

  const fetchAll = useCallback(async () => {
    if (!orgId) return;
    if (!initialLoadedRef.current) setLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("org_id", orgId),
      supabase.from("custom_roles" as any).select("*").eq("org_id", orgId),
    ]);
    if (profilesRes.data) setUsers(profilesRes.data.map(dbToUser));
    if (rolesRes.data) {
      const dbRoles = (rolesRes.data as any[]).map(dbToRole);
      const ROLE_LABELS: Record<string, string> = {
        admin: "Administrador", comercial: "Vendedor", suporte: "Técnico",
        financeiro: "Financeiro", implantacao: "Implantação", leitura: "Leitura",
      };
      const defaultRoles: Role[] = Object.entries(DEFAULT_ROLE_PERMISSIONS).map(([key, perms]) => ({
        id: key, nome: ROLE_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1),
        descricao: `Perfil ${ROLE_LABELS[key] || key}`, permissions: perms, sistema: true,
      }));
      setRoles([...defaultRoles, ...dbRoles]);
    }
    setLoading(false);
    initialLoadedRef.current = true;
  }, [orgId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addUser = useCallback(async (u: Omit<AppUser, "id" | "criadoEm" | "atualizadoEm"> & { password?: string }) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      toast.error("Sessão expirada. Faça login novamente.");
      throw new Error("Sessão expirada");
    }
    const { data, error } = await supabase.functions.invoke("invite-user", {
      body: {
        email: u.email,
        full_name: u.nome,
        role: u.roleId,
        phone: u.telefone,
        password: u.password,
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    if (error) {
      const msg = await getFunctionErrorMessage(error, "Erro ao convidar usuário");
      toast.error(msg);
      throw new Error(msg);
    }
    if (data && (data as any).error) {
      toast.error((data as any).error);
      throw new Error((data as any).error);
    }
    if (u.password) {
      toast.success("Usuário criado com senha definida!");
    } else {
      toast.success("Usuário criado e convite enviado por e-mail!");
    }
    fetchAll();
  }, [fetchAll]);


  const updateUser = useCallback(async (id: string, changes: Partial<AppUser>) => {
    // Alterações de status (ativo/inativo) precisam ir pela edge function
    // para sincronizar o ban_duration no Auth.
    if (changes.ativo !== undefined) {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) { toast.error("Sessão expirada. Faça login novamente."); return; }
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { user_id: id, action: changes.ativo ? "reactivate" : "deactivate" },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) {
        const msg = await getFunctionErrorMessage(error, "Erro ao alterar status");
        toast.error(msg); return;
      }
      if (data && (data as any).error) { toast.error((data as any).error); return; }
    }

    const upd: any = {};
    if (changes.nome !== undefined) upd.full_name = changes.nome;
    if (changes.telefone !== undefined) upd.phone = changes.telefone;
    // Email não é sincronizado com auth.users por aqui — bloqueia edição silenciosa
    if (changes.email !== undefined) {
      toast.info("A alteração de e-mail deve ser feita pelo próprio usuário no login.");
    }
    if (changes.roleId !== undefined) {
      if (DEFAULT_ROLE_PERMISSIONS[changes.roleId]) {
        upd.role = changes.roleId;
        upd.custom_role_id = null;
      } else {
        upd.custom_role_id = changes.roleId;
      }
    }
    if (Object.keys(upd).length > 0) {
      const { error } = await supabase.from("profiles").update(upd).eq("id", id);
      if (error) { toast.error("Erro ao atualizar usuário: " + error.message); return; }
    }
    fetchAll();
  }, [fetchAll]);

  const deleteUser = useCallback(async (id: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      toast.error("Sessão expirada. Faça login novamente.");
      throw new Error("Sessão expirada");
    }
    const { data, error } = await supabase.functions.invoke("delete-user", {
      body: { user_id: id },
      headers: { Authorization: `Bearer ${token}` },
    });

    if (error) {
      const msg = await getFunctionErrorMessage(error, "Erro ao desativar usuário");
      toast.error(msg);
      throw new Error(msg);
    }
    if (data && (data as any).error) {
      toast.error((data as any).error);
      throw new Error((data as any).error);
    }
    if ((data as any)?.already_inactive) {
      toast.success("Usuário já estava inativo; bloqueio de acesso confirmado.");
    } else {
      toast.success("Usuário desativado!");
    }
    fetchAll();
  }, [fetchAll]);


  const setCurrentUser = useCallback((id: string) => setCurrentUserId(id), []);
  const getUser = useCallback((id: string) => users.find(u => u.id === id), [users]);
  const getCurrentUser = useCallback(() => users.find(u => u.id === currentUserId), [users, currentUserId]);

  const addRole = useCallback(async (r: Omit<Role, "id" | "sistema">) => {
    if (!orgId) return;
    const { error } = await supabase.from("custom_roles" as any).insert({
      org_id: orgId, name: r.nome, description: r.descricao, permissions: r.permissions,
    });
    if (error) { toast.error("Erro ao criar perfil: " + error.message); return; }
    fetchAll();
  }, [orgId, fetchAll]);

  const updateRole = useCallback(async (id: string, changes: Partial<Role>) => {
    if (DEFAULT_ROLE_PERMISSIONS[id]) {
      toast.error("Perfis padrão não podem ser editados.");
      return;
    }
    const upd: any = {};
    if (changes.nome !== undefined) upd.name = changes.nome;
    if (changes.descricao !== undefined) upd.description = changes.descricao;
    if (changes.permissions !== undefined) upd.permissions = changes.permissions;
    const { error } = await supabase.from("custom_roles" as any).update(upd).eq("id", id);
    if (error) { toast.error("Erro ao atualizar perfil"); return; }
    fetchAll();
  }, [fetchAll]);

  const deleteRole = useCallback(async (id: string) => {
    if (DEFAULT_ROLE_PERMISSIONS[id]) {
      toast.error("Perfis padrão não podem ser excluídos.");
      return;
    }
    const { error } = await supabase.from("custom_roles" as any).delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir perfil"); return; }
    fetchAll();
  }, [fetchAll]);

  const getRole = useCallback((id: string) => roles.find(r => r.id === id), [roles]);

  const getCurrentPermissions = useCallback(() => {
    const currentUser = users.find(u => u.id === currentUserId);
    if (!currentUser) return DEFAULT_ROLE_PERMISSIONS["leitura"] || [];
    const role = roles.find(r => r.id === currentUser.roleId);
    if (role) return role.permissions;
    const profileRole = profile?.role || "leitura";
    return DEFAULT_ROLE_PERMISSIONS[profileRole] || DEFAULT_ROLE_PERMISSIONS["leitura"] || [];
  }, [users, roles, currentUserId, profile?.role]);

  const hasPermission = useCallback((permission: string) => {
    return getCurrentPermissions().includes(permission);
  }, [getCurrentPermissions]);

  const hasAnyPermission = useCallback((permissions: string[]) => {
    const current = getCurrentPermissions();
    return permissions.some(p => current.includes(p));
  }, [getCurrentPermissions]);

  const resetUsers = useCallback(() => {
    toast.info("Funcionalidade de reset não disponível.");
  }, []);

  const value = useMemo<UsersContextType>(() => ({
    users, roles, currentUserId, loading,
    addUser, updateUser, deleteUser, setCurrentUser, getUser, getCurrentUser,
    addRole, updateRole, deleteRole, getRole,
    hasPermission, hasAnyPermission, getCurrentPermissions,
    resetUsers,
  }), [
    users, roles, currentUserId, loading,
    addUser, updateUser, deleteUser, setCurrentUser, getUser, getCurrentUser,
    addRole, updateRole, deleteRole, getRole,
    hasPermission, hasAnyPermission, getCurrentPermissions,
    resetUsers,
  ]);

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error("useUsers must be used within UsersProvider");
  return ctx;
}
