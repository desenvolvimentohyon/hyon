import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { Role, AppUser } from "@/types/users";
import { seedRoles, seedUsers } from "@/data/seedUsers";

function uid() {
  return Math.random().toString(36).slice(2, 11);
}

interface UsersState {
  users: AppUser[];
  roles: Role[];
  currentUserId: string;
  loading: boolean;
}

interface UsersContextType extends UsersState {
  // Users
  addUser: (u: Omit<AppUser, "id" | "criadoEm" | "atualizadoEm">) => void;
  updateUser: (id: string, changes: Partial<AppUser>) => void;
  deleteUser: (id: string) => void;
  setCurrentUser: (id: string) => void;
  getUser: (id: string) => AppUser | undefined;
  getCurrentUser: () => AppUser | undefined;
  // Roles
  addRole: (r: Omit<Role, "id" | "sistema">) => void;
  updateRole: (id: string, changes: Partial<Role>) => void;
  deleteRole: (id: string) => void;
  getRole: (id: string) => Role | undefined;
  // Permissions
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  getCurrentPermissions: () => string[];
  // Reset
  resetUsers: () => void;
}

const UsersContext = createContext<UsersContextType | null>(null);
const STORAGE_KEY = "gestao-users-data";

function loadFromStorage(): Omit<UsersState, "loading"> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveToStorage(state: Omit<UsersState, "loading">) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createInitialState(): Omit<UsersState, "loading"> {
  return {
    users: seedUsers,
    roles: seedRoles,
    currentUserId: "user-admin",
  };
}

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [currentUserId, setCurrentUserId] = useState("user-admin");
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const timer = setTimeout(() => {
      const saved = loadFromStorage();
      if (saved) {
        setUsers(saved.users);
        setRoles(saved.roles);
        setCurrentUserId(saved.currentUserId);
      } else {
        const initial = createInitialState();
        setUsers(initial.users);
        setRoles(initial.roles);
        setCurrentUserId(initial.currentUserId);
        saveToStorage(initial);
      }
      setLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading) return;
    saveToStorage({ users, roles, currentUserId });
  }, [users, roles, currentUserId, loading]);

  const addUser = useCallback((u: Omit<AppUser, "id" | "criadoEm" | "atualizadoEm">) => {
    const now = new Date().toISOString();
    setUsers(prev => [...prev, { ...u, id: uid(), criadoEm: now, atualizadoEm: now }]);
  }, []);

  const updateUser = useCallback((id: string, changes: Partial<AppUser>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...changes, atualizadoEm: new Date().toISOString() } : u));
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  }, []);

  const setCurrentUser = useCallback((id: string) => {
    setCurrentUserId(id);
  }, []);

  const getUser = useCallback((id: string) => users.find(u => u.id === id), [users]);
  const getCurrentUser = useCallback(() => users.find(u => u.id === currentUserId), [users, currentUserId]);

  const addRole = useCallback((r: Omit<Role, "id" | "sistema">) => {
    setRoles(prev => [...prev, { ...r, id: uid(), sistema: false }]);
  }, []);

  const updateRole = useCallback((id: string, changes: Partial<Role>) => {
    setRoles(prev => prev.map(r => r.id === id ? { ...r, ...changes } : r));
  }, []);

  const deleteRole = useCallback((id: string) => {
    setRoles(prev => prev.filter(r => r.id !== id || r.sistema));
  }, []);

  const getRole = useCallback((id: string) => roles.find(r => r.id === id), [roles]);

  const getCurrentPermissions = useCallback(() => {
    const user = users.find(u => u.id === currentUserId);
    if (!user) return [];
    const role = roles.find(r => r.id === user.roleId);
    return role?.permissions || [];
  }, [users, roles, currentUserId]);

  const hasPermission = useCallback((permission: string) => {
    return getCurrentPermissions().includes(permission);
  }, [getCurrentPermissions]);

  const hasAnyPermission = useCallback((permissions: string[]) => {
    const current = getCurrentPermissions();
    return permissions.some(p => current.includes(p));
  }, [getCurrentPermissions]);

  const resetUsers = useCallback(() => {
    const initial = createInitialState();
    setUsers(initial.users);
    setRoles(initial.roles);
    setCurrentUserId(initial.currentUserId);
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
