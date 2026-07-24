import { describe, it, expect } from "vitest";
import { computeQuote } from "../engine";
import { computeSetup } from "../setup";

describe("computeQuote — regras críticas", () => {
  it("respeita valor mínimo do plano", () => {
    const q = computeQuote({
      plan: {
        id: "p1",
        name: "Essencial",
        basePrice: 100,
        minValue: 200,
      },
      modules: [],
      cycle: "monthly",
    });
    expect(q.subtotal).toBe(100);
    expect(q.monthlyBase).toBe(200);
    expect(q.applied.minValueApplied).toBe(true);
  });

  it("aplica bonusCount transformando os módulos extras mais baratos em bônus", () => {
    const q = computeQuote({
      plan: { id: "p1", name: "Pro", basePrice: 300, bonusCount: 1 },
      modules: [
        { id: "a", name: "A", unitPrice: 50, quantity: 1 },
        { id: "b", name: "B", unitPrice: 100, quantity: 1 },
      ],
      cycle: "monthly",
    });
    const bonusLine = q.lines.find((l) => l.id === "mod:a");
    expect(bonusLine?.kind).toBe("module-bonus");
    expect(bonusLine?.total).toBe(0);
    expect(q.subtotal).toBe(300 + 100); // A virou bônus
  });

  it("aplica desconto anual de 10%", () => {
    const q = computeQuote({
      plan: {
        id: "p1",
        name: "X",
        basePrice: 100,
        cycleDiscounts: { quarterly: 5, annual: 10 },
      },
      modules: [],
      cycle: "annual",
    });
    expect(q.cycleDiscountPct).toBe(10);
    expect(q.monthlyAfterCycleDiscount).toBe(90);
    expect(q.cycleTotal).toBe(1080);
    expect(q.savingsVsMonthly).toBe(120);
  });

  it("aplica desconto trimestral de 5%", () => {
    const q = computeQuote({
      plan: {
        id: "p1",
        name: "X",
        basePrice: 200,
        cycleDiscounts: { quarterly: 5, annual: 10 },
      },
      modules: [],
      cycle: "quarterly",
    });
    expect(q.cycleTotal).toBe(200 * 0.95 * 3);
  });

  it("soma módulos extras com quantidade e desconto individual", () => {
    const q = computeQuote({
      plan: { id: "p1", name: "X", basePrice: 100 },
      modules: [{ id: "a", name: "A", unitPrice: 50, quantity: 2, discountPct: 10 }],
      cycle: "monthly",
    });
    // 50*2 = 100, -10% = 90
    expect(q.subtotal).toBe(190);
  });

  it("aplica desconto global e usa fallback de ciclo", () => {
    const q = computeQuote({
      plan: { id: "p1", name: "X", basePrice: 100 },
      modules: [],
      cycle: "annual",
      globalDiscountPct: 10,
      defaultCycleDiscounts: { quarterly: 5, annual: 10 },
    });
    // 100 -10% global = 90; anual -10% = 81
    expect(q.monthlyBase).toBe(90);
    expect(q.monthlyAfterCycleDiscount).toBe(81);
  });
});

describe("computeSetup", () => {
  it("calcula (dist × custo) + regiao + (dias × diaria)", () => {
    const s = computeSetup({
      distanceKm: 50,
      costPerKm: 2,
      days: 3,
      dailyRate: 200,
      regionBase: 150,
    });
    expect(s.distance).toBe(100);
    expect(s.labor).toBe(600);
    expect(s.region).toBe(150);
    expect(s.total).toBe(850);
  });

  it("retorna zeros quando não há entrada", () => {
    const s = computeSetup();
    expect(s.total).toBe(0);
  });
});
