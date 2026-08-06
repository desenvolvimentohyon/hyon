import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/core/logger/logger";

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000;

export const iaService = {
  async ask(question: string, retryCount = 0, onRetry?: (msg: string) => void, context?: any): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke("ia-assistant", {
        body: { question, context },
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (err: any) {
      const isNetworkError = !err.status || err.status >= 500;
      
      if (isNetworkError && retryCount < MAX_RETRIES) {
        const delay = INITIAL_DELAY * Math.pow(2, retryCount);
        const retryMsg = `Tentando reconectar (${retryCount + 1}/${MAX_RETRIES})...`;
        
        logger.warn(`IA Assistant retry ${retryCount + 1}/${MAX_RETRIES} in ${delay}ms...`, err);
        
        if (onRetry) onRetry(retryMsg);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.ask(question, retryCount + 1, onRetry, context);
      }

      logger.error("IA Assistant final failure after retries", err);
      throw err;
    }
  }
};
