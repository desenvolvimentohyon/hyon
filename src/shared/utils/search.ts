import { logger } from "@/core/logger/logger";

/**
 * Utilitário de pesquisa global (Command Palette logic)
 */
export const globalSearch = async (query: string) => {
  if (!query || query.length < 2) return [];
  
  try {
    const { data, error } = await supabase
      .from('global_search_view') // View sugerida para o banco
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
