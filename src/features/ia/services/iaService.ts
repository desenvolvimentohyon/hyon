import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/core/logger/logger";

export const iaService = {
  async ask(question: string) {
    try {
      const { data, error } = await supabase.functions.invoke("ia-assistant", {
        body: { question },
      });
      if (error) throw error;
      return data;
    } catch (err) {
      logger.error("IA Assistant error", err);
      throw err;
    }
  }
};
