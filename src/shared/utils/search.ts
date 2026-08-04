import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/core/logger/logger";


/**
 * Utilitário de pesquisa global (Command Palette logic)
 */
export const globalSearch = async (query: string) => {
  if (!query || query.length < 2) return [];
  
  try {
    const { data, error } = await supabase
      .from('clients') // Usando clients como fallback enquanto a view global não existe
      .select('*')
      .ilike('content', `%${query}%`)
      .limit(10);
      
    if (error) throw error;
    return data;
  } catch (err) {
    logger.error("Global search failed", err);
    return [];
  }
};
