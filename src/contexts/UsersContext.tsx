import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Role, AppUser, ALL_PERMISSIONS } from "@/types/users";

// Default permission sets mapped to profile.role
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

// ===== Mappers =====
function dbToRole(r: any): Role {
  return {
    id: r.id, nome: r.name, descricao: r.description,
    permissions: r.permissions || [], sistema: r.is_system,
  };
}

function dbToUser(r: any): AppUser {
  return {
    id: r.id, nome: r.full_name, email: "",
    ativo: r.is_active, roleId: r.custom_role_id || r.role,
    criadoEm: r.created_at, atualizadoEm: r.updated_at,
  };
}

interface UsersState {
  users: AppUser[];
  roles: Role[];
  currentUserId: string;
  loading: boolean;
}

interface UsersContextType extends UsersState {
  addUser: (u: Omit<AppUser, "id" | "criadoEm" | "atualizadoEm">) => void;
  updateUser: (id: string, changes: Partial<AppUser>) => void;
  deleteUser: (id: string) => void;
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

  useEffect(() => {
    if (user?.id) setCurrentUserId(user.id);
  }, [user?.id]);

  const fetchAll = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("custom_roles" as any).select("*"),
    ]);
    if (profilesRes.data) setUsers(profilesRes.data.map(dbToUser));
    if (rolesRes.data) {
      const dbRoles = (rolesRes.data as any[]).map(dbToRole);
      // Add default roles from profile.role if no custom roles exist
      const ROLE_LABELS: Record<string, string> = {
        admin: "Administrador", comercial: "Vendedor", suporte: "Técnico",
        financeiro: "Financeiro", implantacao: "Implantação", leitura: "Leitura",
      };
      const defaultRoles: Role[] = Object.entries(DEFAULT_ROLE_PERMISSIONS).map(([key, perms]) => ({
        id: key, nome: ROLE_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1),
        descricao: `Perfil ${ROLE_LABELS[key] || key}`, permissions: perms, sistema: true,
      }));
      // Merge: custom roles + default roles (for users without custom_role_id)
      setRoles([...defaultRoles, ...dbRoles]);
    }
    setLoading(false);
  }, [orgId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addUser = useCallback(async (_u: Omit<AppUser, "id" | "criadoEm" | "atualizadoEm">) => {
    toast.info("Para adicionar usuários, use o convite por email via gestão de usuários.");
  }, []);

  const updateUser = useCallback(async (id: string, changes: Partial<AppUser>) => {
    const upd: any = {};
    if (changes.nome !== undefined) upd.full_name = changes.nome;
    if (changes.ativo !== undefined) upd.is_active = changes.ativo;
    if (changes.roleId !== undefined) {
      // If roleId matches a default role name, update profile.role
      if (DEFAULT_ROLE_PERMISSIONS[changes.roleId]) {
        upd.role = changes.roleId;
        upd.custom_role_id = null;
      } else {
        // It's a custom role UUID
        upd.custom_role_id = changes.roleId;
      }
    }
    const { error } = await supabase.from("profiles").update(upd).eq("id", id);
    if (error) { toast.error("Erro ao atualizar usuário: " + error.message); return; }
    fetchAll();
  }, [fetchAll]);

  const deleteUser = useCallback(async (_id: string) => {
    toast.info("Desative o usuário ao invés de excluir.");
  }, []);

  const setCurrentUser = useCallback((id: string) => setCurrentUserId(id), []);
  const getUser = useCallback((id: string) => users.find(u => u.id === id), [users]);
  const getCurrentUser = useCallback(() => users.find(u => u.id === currentUserId), [users, currentUserId]);

  // ===== Roles =====
  const addRole = useCallback(async (r: Omit<Role, "id" | "sistema">) => {
    if (!orgId) return;
    const { error } = await supabase.from("custom_roles" as any).insert({
      org_id: orgId, name: r.nome, description: r.descricao, permissions: r.permissions,
    });
    if (error) { toast.error("Erro ao criar perfil: " + error.message); return; }
    fetchAll();
  }, [orgId, fetchAll]);

  const updateRole = useCallback(async (id: string, changes: Partial<Role>) => {
    // Don't update default roles
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
    // Find role by roleId
    const role = roles.find(r => r.id === currentUser.roleId);
    if (role) return role.permissions;
    // Fallback to profile role text
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

  const value: UsersContextType = {
    users, roles, currentUserId, loading,
    addUser, updateUser, deleteUser, setCurrentUser, getUser, getCurrentUser,
    addRole, updateRole, deleteRole, getRole,
    hasPermission, hasAnyPermission, getCurrentPermissions,
    resetUsers,
  };

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error("useUsers must be used within UsersProvider");
  return ctx;
}
