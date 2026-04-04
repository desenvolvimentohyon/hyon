import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TemplateStage {
  title: string;
  sort_order: number;
}

export interface TemplateCheckItem {
  title: string;
  stage_index: number | null;
  sort_order: number;
}

export interface DevTemplate {
  id: string;
  org_id: string;
  name: string;
  description: string;
  stages: TemplateStage[];
  checklist: TemplateCheckItem[];
  created_at: string;
  updated_at: string;
}

export function useDevTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<DevTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: profile } = await supabase.from("profiles" as any).select("org_id").eq("id", user.id).single();
    if (!profile) { setLoading(false); return; }
    const orgId = (profile as any).org_id;

    const { data, error } = await supabase
      .from("dev_templates" as any)
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (error) { toast.error("Erro ao carregar templates"); setLoading(false); return; }
    setTemplates((data as any[]).map((t: any) => ({
      ...t,
      stages: Array.isArray(t.stages) ? t.stages : JSON.parse(t.stages || "[]"),
      checklist: Array.isArray(t.checklist) ? t.checklist : JSON.parse(t.checklist || "[]"),
    })));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const saveTemplate = async (template: Partial<DevTemplate> & { id?: string }) => {
    const { data: profile } = await supabase.from("profiles" as any).select("org_id").eq("id", user!.id).single();
    const orgId = (profile as any).org_id;

    if (template.id) {
      const { id, org_id, created_at, updated_at, ...updates } = template as any;
      const { error } = await supabase.from("dev_templates" as any).update(updates as any).eq("id", id);
      if (error) { toast.error("Erro ao atualizar template"); return false; }
      toast.success("Template atualizado!");
    } else {
      const { id, org_id, created_at, updated_at, ...insert } = template as any;
      const { error } = await supabase.from("dev_templates" as any).insert({ ...insert, org_id: orgId } as any);
      if (error) { toast.error("Erro ao criar template"); return false; }
      toast.success("Template criado!");
    }
    fetchTemplates();
    return true;
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase.from("dev_templates" as any).delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir template"); return false; }
    toast.success("Template excluído!");
    fetchTemplates();
    return true;
  };

  return { templates, loading, fetchTemplates, saveTemplate, deleteTemplate };
}
