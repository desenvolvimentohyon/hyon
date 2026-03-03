import { ClienteReceita, SuporteEvento, SistemaPrincipal } from "@/types/receita";

const past = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

let uid = 100;
const id = () => `cr${uid++}`;

// Target: 31 ativos, 1 cancelado
// MRR ≈ 6090.45 | Custos ≈ 1372.50
// Custos: PDV+ 646.50, LinkPro 520.60, Torge 159.30, Emissor Fiscal 39.80, Hyon Hospede 3.20

const clientes: { nome: string; sistema: SistemaPrincipal; mensalidade: number; custo: number; status: "ativo" | "atraso" | "suspenso" | "cancelado"; cidade?: string; doc?: string }[] = [
  // PDV+ clients (12) - custo total 646.50
  { nome: "Supermercado Bom Preço", sistema: "PDV+", mensalidade: 350, custo: 85, status: "ativo", cidade: "São Paulo", doc: "12.345.678/0001-90" },
  { nome: "Mercearia São Jorge", sistema: "PDV+", mensalidade: 180, custo: 45, status: "ativo", cidade: "Campinas" },
  { nome: "Minimercado Estrela", sistema: "PDV+", mensalidade: 220, custo: 55, status: "ativo", cidade: "Santos" },
  { nome: "Padaria Pão Quente", sistema: "PDV+", mensalidade: 150, custo: 38, status: "ativo", cidade: "Guarulhos", doc: "23.456.789/0001-01" },
  { nome: "Açougue Premium", sistema: "PDV+", mensalidade: 195, custo: 48, status: "ativo", cidade: "São Paulo" },
  { nome: "Hortifruti Natural", sistema: "PDV+", mensalidade: 160, custo: 40, status: "ativo", cidade: "Osasco" },
  { nome: "Conveniência 24h", sistema: "PDV+", mensalidade: 130, custo: 32, status: "atraso", cidade: "Barueri" },
  { nome: "Empório Gourmet", sistema: "PDV+", mensalidade: 280, custo: 70, status: "ativo", cidade: "São Paulo", doc: "34.567.890/0001-12" },
  { nome: "Distribuidora Central", sistema: "PDV+", mensalidade: 320, custo: 80, status: "ativo", cidade: "Jundiaí" },
  { nome: "Loja Tudo Certo", sistema: "PDV+", mensalidade: 175, custo: 43.5, status: "ativo", cidade: "Sorocaba" },
  { nome: "Mercadinho do Zé", sistema: "PDV+", mensalidade: 140, custo: 35, status: "suspenso", cidade: "Limeira" },
  { nome: "Casa de Carnes Silva", sistema: "PDV+", mensalidade: 200, custo: 75, status: "ativo", cidade: "Ribeirão Preto" },

  // LinkPro clients (9) - custo total 520.60
  { nome: "Loja Central Modas", sistema: "LinkPro", mensalidade: 380, custo: 95, status: "ativo", cidade: "Belo Horizonte", doc: "45.678.901/0001-23" },
  { nome: "Auto Peças Nacional", sistema: "LinkPro", mensalidade: 320, custo: 80, status: "ativo", cidade: "Campinas", doc: "56.789.012/0001-34" },
  { nome: "Pet Shop Amigo Fiel", sistema: "LinkPro", mensalidade: 190, custo: 47.6, status: "atraso", cidade: "São Paulo" },
  { nome: "Farmácia Vida Plena", sistema: "LinkPro", mensalidade: 250, custo: 62, status: "ativo", cidade: "Guarulhos" },
  { nome: "Loja Esporte Mania", sistema: "LinkPro", mensalidade: 210, custo: 52, status: "ativo", cidade: "Santo André" },
  { nome: "Papelaria Criativa", sistema: "LinkPro", mensalidade: 160, custo: 40, status: "ativo", cidade: "São Bernardo" },
  { nome: "Eletrônicos Tech", sistema: "LinkPro", mensalidade: 290, custo: 72, status: "ativo", cidade: "Mogi das Cruzes" },
  { nome: "Bazar Mil Coisas", sistema: "LinkPro", mensalidade: 145, custo: 36, status: "ativo", cidade: "Diadema" },
  { nome: "Magazine Express", sistema: "LinkPro", mensalidade: 230, custo: 36, status: "ativo", cidade: "Osasco" },

  // Torge clients (5) - custo total 159.30
  { nome: "Restaurante Sabor & Arte", sistema: "Torge", mensalidade: 200, custo: 42, status: "ativo", cidade: "Rio de Janeiro", doc: "67.890.123/0001-45" },
  { nome: "Doceria Bella", sistema: "Torge", mensalidade: 150, custo: 35, status: "ativo", cidade: "Curitiba" },
  { nome: "Lanchonete Expresso", sistema: "Torge", mensalidade: 120, custo: 28, status: "ativo", cidade: "São Paulo" },
  { nome: "Pizzaria Napolitana", sistema: "Torge", mensalidade: 180, custo: 32.3, status: "ativo", cidade: "São Paulo" },
  { nome: "Bar do João", sistema: "Torge", mensalidade: 110, custo: 22, status: "cancelado", cidade: "Campinas" },

  // Emissor Fiscal (3) - custo total 39.80
  { nome: "Materiais ABC Construção", sistema: "Emissor Fiscal", mensalidade: 95, custo: 18, status: "ativo", cidade: "São Paulo", doc: "78.901.234/0001-56" },
  { nome: "Contabilidade Foco", sistema: "Emissor Fiscal", mensalidade: 80, custo: 12.8, status: "ativo", cidade: "São Paulo" },
  { nome: "Escritório Prime", sistema: "Emissor Fiscal", mensalidade: 70, custo: 9, status: "ativo", cidade: "Barueri" },

  // Hyon Hospede (3) - custo total 3.20
  { nome: "Hotel Bela Vista", sistema: "Hyon Hospede", mensalidade: 110.45, custo: 1.2, status: "ativo", cidade: "Campos do Jordão" },
  { nome: "Pousada Recanto", sistema: "Hyon Hospede", mensalidade: 80, custo: 1, status: "ativo", cidade: "Ubatuba" },
  { nome: "Hostel Aventura", sistema: "Hyon Hospede", mensalidade: 60, custo: 1, status: "ativo", cidade: "Paraty" },
];

export const seedClientesReceita: ClienteReceita[] = clientes.map((c, i) => ({
  id: `cr${i + 1}`,
  nome: c.nome,
  documento: c.doc,
  telefone: `(11) 9${String(1000 + i).slice(0, 4)}-${String(5000 + i * 7).slice(0, 4)}`,
  email: c.nome.toLowerCase().replace(/[^a-z]/g, "").slice(0, 10) + "@email.com",
  cidade: c.cidade,
  sistemaPrincipal: c.sistema,
  statusCliente: c.status,
  mensalidadeAtiva: c.status === "ativo" || c.status === "atraso",
  valorMensalidade: c.mensalidade,
  dataInicio: past(90 + Math.floor(Math.random() * 365)),
  dataCancelamento: c.status === "cancelado" ? past(45) : null,
  motivoCancelamento: c.status === "cancelado" ? "Optou por concorrente" : null,
  observacoes: undefined,
  custoAtivo: c.status !== "cancelado",
  valorCustoMensal: c.custo,
  sistemaCusto: c.sistema,
}));

// Generate support events
const tipos: ("suporte" | "implantacao" | "treinamento")[] = ["suporte", "implantacao", "treinamento"];
export const seedSuporteEventos: SuporteEvento[] = [];
let evtId = 1;
seedClientesReceita.forEach(c => {
  const count = Math.floor(Math.random() * 8) + 1;
  for (let i = 0; i < count; i++) {
    seedSuporteEventos.push({
      id: `evt${evtId++}`,
      clienteId: c.id,
      tipo: tipos[Math.floor(Math.random() * 3)],
      criadoEm: past(Math.floor(Math.random() * 365)),
      duracaoMinutos: Math.floor(Math.random() * 120) + 10,
      resolvido: Math.random() > 0.2,
    });
  }
});
