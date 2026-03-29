import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface DevProject {
  id: string;
  org_id: string;
  client_id: string | null;
  title: string;
  description: string;
  status: string;
  plan_type: string;
  project_value: number;
  monthly_value: number;
  setup_value: number;
  started_at: string | null;
  deadline_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client_name?: string;
  stages_total?: number;
  stages_done?: number;
  checklist_total?: number;
  checklist_done?: number;
}

export interface DevStage {
  id: string;
  org_id: string;
  project_id: string;
  title: string;
  sort_order: number;
  status: string;
  deadline_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface DevCheckItem {
  id: string;
  org_id: string;
  project_id: string;
  stage_id: string | null;
  title: string;
  completed: boolean;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
}

export function useDevProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<DevProject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: profile } = await supabase.from("profiles" as any).select("org_id").eq("id", user.id).single();
    if (!profile) { setLoading(false); return; }
    const orgId = (profile as any).org_id;

    const { data, error } = await supabase
      .from("dev_projects" as any)
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (error) { toast.error("Erro ao carregar projetos"); setLoading(false); return; }

    const projectIds = (data as any[]).map((p: any) => p.id);

    let stagesMap: Record<string, { total: number; done: number }> = {};
    let checkMap: Record<string, { total: number; done: number }> = {};

    if (projectIds.length > 0) {
      const { data: stages } = await supabase
        .from("dev_project_stages" as any)
        .select("project_id, status")
        .in("project_id", projectIds);
      if (stages) {
        for (const s of stages as any[]) {
          if (!stagesMap[s.project_id]) stagesMap[s.project_id] = { total: 0, done: 0 };
          stagesMap[s.project_id].total++;
          if (s.status === "concluida") stagesMap[s.project_id].done++;
        }
      }

      const { data: checks } = await supabase
        .from("dev_project_checklist" as any)
        .select("project_id, completed")
        .in("project_id", projectIds);
      if (checks) {
        for (const c of checks as any[]) {
          if (!checkMap[c.project_id]) checkMap[c.project_id] = { total: 0, done: 0 };
          checkMap[c.project_id].total++;
          if (c.completed) checkMap[c.project_id].done++;
        }
      }
    }

    // Get client names
    const clientIds = [...new Set((data as any[]).map((p: any) => p.client_id).filter(Boolean))];
    let clientNames: Record<string, string> = {};
    if (clientIds.length > 0) {
      const { data: clients } = await supabase.from("clients").select("id, name").in("id", clientIds);
      if (clients) {
        for (const c of clients) clientNames[c.id] = c.name;
      }
    }

    setProjects((data as any[]).map((p: any) => ({
      ...p,
      client_name: p.client_id ? clientNames[p.client_id] || "—" : "—",
      stages_total: stagesMap[p.id]?.total || 0,
      stages_done: stagesMap[p.id]?.done || 0,
      checklist_total: checkMap[p.id]?.total || 0,
      checklist_done: checkMap[p.id]?.done || 0,
    })));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const createProject = async (project: Partial<DevProject>) => {
    const { data: profile } = await supabase.from("profiles" as any).select("org_id").eq("id", user!.id).single();
    const orgId = (profile as any).org_id;
    const { error } = await supabase.from("dev_projects" as any).insert({ ...project, org_id: orgId } as any);
    if (error) { toast.error("Erro ao criar projeto"); return false; }
    toast.success("Projeto criado!");
    fetchProjects();
    return true;
  };

  const updateProject = async (id: string, updates: Partial<DevProject>) => {
    const { error } = await supabase.from("dev_projects" as any).update(updates as any).eq("id", id);
    if (error) { toast.error("Erro ao atualizar projeto"); return false; }
    toast.success("Projeto atualizado!");
    fetchProjects();
    return true;
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from("dev_projects" as any).delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir projeto"); return false; }
    toast.success("Projeto excluído!");
    fetchProjects();
    return true;
  };

  return { projects, loading, fetchProjects, createProject, updateProject, deleteProject };
}

export function useDevStages(projectId: string | undefined) {
  const { user } = useAuth();
  const [stages, setStages] = useState<DevStage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStages = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("dev_project_stages" as any)
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order");
    if (!error && data) setStages(data as any);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchStages(); }, [fetchStages]);

  const addStage = async (stage: Partial<DevStage>) => {
    const { data: profile } = await supabase.from("profiles" as any).select("org_id").eq("id", user!.id).single();
    const orgId = (profile as any).org_id;
    const { error } = await supabase.from("dev_project_stages" as any).insert({ ...stage, org_id: orgId, project_id: projectId } as any);
    if (error) { toast.error("Erro ao adicionar etapa"); return false; }
    fetchStages();
    return true;
  };

  const updateStage = async (id: string, updates: Partial<DevStage>) => {
    const { error } = await supabase.from("dev_project_stages" as any).update(updates as any).eq("id", id);
    if (error) { toast.error("Erro ao atualizar etapa"); return false; }
    fetchStages();
    return true;
  };

  const deleteStage = async (id: string) => {
    const { error } = await supabase.from("dev_project_stages" as any).delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir etapa"); return false; }
    fetchStages();
    return true;
  };

  return { stages, loading, fetchStages, addStage, updateStage, deleteStage };
}

export function useDevChecklist(projectId: string | undefined) {
  const { user } = useAuth();
  const [items, setItems] = useState<DevCheckItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("dev_project_checklist" as any)
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order");
    if (!error && data) setItems(data as any);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const addItem = async (item: Partial<DevCheckItem>) => {
    const { data: profile } = await supabase.from("profiles" as any).select("org_id").eq("id", user!.id).single();
    const orgId = (profile as any).org_id;
    const { error } = await supabase.from("dev_project_checklist" as any).insert({ ...item, org_id: orgId, project_id: projectId } as any);
    if (error) { toast.error("Erro ao adicionar item"); return false; }
    fetchItems();
    return true;
  };

  const updateItem = async (id: string, updates: Partial<DevCheckItem>) => {
    const { error } = await supabase.from("dev_project_checklist" as any).update(updates as any).eq("id", id);
    if (error) { toast.error("Erro ao atualizar item"); return false; }
    fetchItems();
    return true;
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("dev_project_checklist" as any).delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir item"); return false; }
    fetchItems();
    return true;
  };

  const toggleItem = async (id: string, completed: boolean) => {
    const updates: any = { completed, completed_at: completed ? new Date().toISOString() : null };
    return updateItem(id, updates);
  };

  return { items, loading, fetchItems, addItem, updateItem, deleteItem, toggleItem };
}
