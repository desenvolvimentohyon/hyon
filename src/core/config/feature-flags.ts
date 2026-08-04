import { logger } from '@/core/logger/logger';

/**
 * Sistema de Feature Flags para o ERP SaaS.
 * Permite ativar ou desativar módulos sem alterar código.
 * Integrado com o sistema de parâmetros e perfil do usuário.
 */

export type FeatureKey = 
  | 'crm' 
  | 'financeiro' 
  | 'ia_assistant' 
  | 'pix_pagamentos' 
  | 'dashboard_v2' 
  | 'gestao_tarefas';

class FeatureFlagManager {
  private static instance: FeatureFlagManager;
  
  // Flags padrão baseadas no ambiente
  private flags: Record<FeatureKey, boolean> = {
    crm: true,
    financeiro: true,
    ia_assistant: true,
    pix_pagamentos: true,
    dashboard_v2: true,
    gestao_tarefas: true,
  };

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): FeatureFlagManager {
    if (!FeatureFlagManager.instance) {
      FeatureFlagManager.instance = new FeatureFlagManager();
    }
    return FeatureFlagManager.instance;
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem('erp_feature_flags');
      if (saved) {
        this.flags = { ...this.flags, ...JSON.parse(saved) };
      }
    } catch (e) {
      logger.warn('Failed to load feature flags from storage');
    }
  }

  public isEnabled(feature: FeatureKey): boolean {
    return !!this.flags[feature];
  }

  public setFeature(feature: FeatureKey, enabled: boolean) {
    this.flags[feature] = enabled;
    localStorage.setItem('erp_feature_flags', JSON.stringify(this.flags));
    logger.info(`Feature flag ${feature} changed to ${enabled}`);
  }

  public getAll(): Record<FeatureKey, boolean> {
    return { ...this.flags };
  }
}

export const featureFlags = FeatureFlagManager.getInstance();
