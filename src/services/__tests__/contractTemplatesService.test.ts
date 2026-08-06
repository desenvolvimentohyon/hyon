import { describe, it, expect, vi } from "vitest";

// Evita a inicialização do cliente Supabase (depende de import.meta.env)
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/core/logger/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));

import {
  isValidDocument,
  formatDocument,
  buildTemplateBindings,
  renderTemplate,
  CONTRACT_VARIABLES,
  type ContractExtraction,
} from "../contractTemplatesService";

describe("extração de CNPJ para contratos", () => {
  it("valida CNPJs reais da base", () => {
    expect(isValidDocument("58.447.022/0001-84")).toBe(true);
    expect(isValidDocument("35.325.002/0001-35")).toBe(true);
    expect(isValidDocument("62413036000154")).toBe(true);
  });

  it("rejeita documentos inválidos", () => {
    expect(isValidDocument("11.111.111/1111-11")).toBe(false);
    expect(isValidDocument("123")).toBe(false);
    expect(isValidDocument(null)).toBe(false);
  });

  it("formata CNPJ e CPF", () => {
    expect(formatDocument("58447022000184")).toBe("58.447.022/0001-84");
    expect(formatDocument("52998224725")).toBe("529.982.247-25");
  });
});

const extraction: ContractExtraction = {
  clienteId: "1",
  nome: "SAH ASSADOS",
  razaoSocial: null,
  nomeFantasia: null,
  documento: "62413036000154",
  documentoFormatado: "62.413.036/0001-54",
  documentoValido: true,
  inscricaoEstadual: null,
  email: null,
  telefone: null,
  enderecoCompleto: "Rua A, 100, Centro",
  regimeTributario: "simples",
  responsavelLegal: null,
  sistemaNome: "HYON",
  modulos: [{ id: "m1", nome: "Fiscal", quantidade: 2, valorUnitario: 50, valorTotal: 100 }],
  valorModulos: 100,
  valorMensalidade: 190,
  valorMensalidadeBase: 190,
  diaVencimento: 5,
  dataInicioContrato: null,
  indiceReajuste: "IPCA",
  percentualReajuste: null,
  camposFaltantes: [],
};

describe("bindings e renderização do template", () => {
  it("gera bindings para todas as variáveis do catálogo", () => {
    const bindings = buildTemplateBindings(extraction);
    for (const v of CONTRACT_VARIABLES) {
      expect(bindings).toHaveProperty(v.key);
    }
    expect(bindings.modulos_lista).toContain("Fiscal (x2)");
    expect(bindings.cliente_cnpj).toBe("62.413.036/0001-54");
  });

  it("substitui placeholders e preserva desconhecidos", () => {
    const out = renderTemplate(
      "Cliente {{cliente_nome}} — CNPJ {{cliente_cnpj}} — {{desconhecido}}",
      buildTemplateBindings(extraction),
    );
    expect(out).toContain("SAH ASSADOS");
    expect(out).toContain("62.413.036/0001-54");
    expect(out).toContain("{{desconhecido}}");
  });
});
