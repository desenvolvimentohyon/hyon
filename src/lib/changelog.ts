export interface ChangelogEntry {
  version: string;
  date: string; // ISO
  changes: { type: "novo" | "melhoria" | "correcao"; text: string }[];
}

// Ordem: mais recente primeiro. Ao subir uma nova versão, adicione no topo.
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.5.0",
    date: "2026-07-24",
    changes: [
      { type: "novo", text: "Precificação de implantação por sistema (override de KM, diária e taxa fixa)." },
      { type: "melhoria", text: "Checkout Interno e Proposta Inteligente usam o motor unificado de setup." },
      { type: "melhoria", text: "PlanBuilder da landing exibe implantação estimada por sistema selecionado." },
      { type: "melhoria", text: "Reuniões integradas ao Google Calendar com lembretes push." },
    ],
  },
  {
    version: "1.4.0",
    date: "2026-07-08",
    changes: [
      { type: "novo", text: "Histórico de versões acessível pelo ícone no topo." },
      { type: "melhoria", text: "Refinamento minimalista global (sombras, bordas, tipografia)." },
      { type: "correcao", text: "Cadastro de usuários agora conclui o convite corretamente." },
      { type: "correcao", text: "Removido auto-reload que descartava formulários em edição." },
    ],
  },
  {
    version: "1.3.0",
    date: "2026-07-01",
    changes: [
      { type: "melhoria", text: "Wave 1 de UI: contraste, hover states e microinterações." },
      { type: "melhoria", text: "Marca d'água Lovable ocultada nas publicações Pro." },
    ],
  },
  {
    version: "1.2.0",
    date: "2026-06-15",
    changes: [
      { type: "novo", text: "Central de notificações consolidada no topo." },
      { type: "novo", text: "Portal do Cliente com token exclusivo." },
      { type: "melhoria", text: "Isolamento multi-tenant reforçado em todas as rotas." },
    ],
  },
];

export const CURRENT_VERSION = CHANGELOG[0]?.version ?? "1.0.0";
