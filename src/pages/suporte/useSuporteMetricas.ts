import { useMemo } from "react";
import type { Tarefa } from "@/types";

export function useSuporteMetricas(
  chamados: Tarefa[],
  concluidos: Tarefa[],
  slaVencidoCount: number,
  getTecnico: (id: string) => { nome: string } | undefined
) {
  const slaMetrics = useMemo(() => {
    const concluidosComSla = concluidos.filter(t => t.slaHoras && t.criadoEm);
    const dentroSla = concluidosComSla.filter(t => {
      const deadline = new Date(new Date(t.criadoEm).getTime() + (t.slaHoras || 0) * 3600000);
      return new Date(t.atualizadoEm) <= deadline;
    });
    const taxaCumprimento = concluidosComSla.length > 0
      ? Math.round((dentroSla.length / concluidosComSla.length) * 100)
      : 100;

    const tempoMedioSeg = concluidos.length > 0
      ? concluidos.reduce((a, t) => a + t.tempoTotalSegundos, 0) / concluidos.length
      : 0;
    const tempoMedioH = tempoMedioSeg / 3600;

    const porPrioridade = ["urgente", "alta", "media", "baixa"].map(p => {
      const items = concluidos.filter(t => t.prioridade === p);
      const media = items.length > 0 ? items.reduce((a, t) => a + t.tempoTotalSegundos, 0) / items.length / 3600 : 0;
      return { prioridade: p.charAt(0).toUpperCase() + p.slice(1), horas: parseFloat(media.toFixed(1)), count: items.length };
    });

    const satisfacao = (() => {
      let score = 85;
      if (taxaCumprimento < 80) score -= 15;
      if (tempoMedioH > 8) score -= 10;
      if (slaVencidoCount > 3) score -= 10;
      const reincidentes = chamados.filter(t => t.reincidente).length;
      if (reincidentes > 2) score -= 5;
      return Math.max(0, Math.min(100, score));
    })();

    const statusDist = [
      { name: "Backlog", value: chamados.filter(t => t.status === "backlog").length },
      { name: "A Fazer", value: chamados.filter(t => t.status === "a_fazer").length },
      { name: "Em Andamento", value: chamados.filter(t => t.status === "em_andamento").length },
      { name: "Aguardando", value: chamados.filter(t => t.status === "aguardando_cliente").length },
      { name: "Concluída", value: chamados.filter(t => t.status === "concluida").length },
      { name: "Cancelada", value: chamados.filter(t => t.status === "cancelada").length },
    ].filter(d => d.value > 0);

    const porSistema = [
      { sistema: "Hyon", total: chamados.filter(t => t.sistemaRelacionado === "hyon").length, resolvidos: concluidos.filter(t => t.sistemaRelacionado === "hyon").length },
      { sistema: "LinkPro", total: chamados.filter(t => t.sistemaRelacionado === "linkpro").length, resolvidos: concluidos.filter(t => t.sistemaRelacionado === "linkpro").length },
      { sistema: "Outros", total: chamados.filter(t => !t.sistemaRelacionado).length, resolvidos: concluidos.filter(t => !t.sistemaRelacionado).length },
    ].filter(d => d.total > 0);

    const reincidentes = chamados.filter(t => t.reincidente);

    const volumeMensal = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const mes = d.toLocaleString("pt-BR", { month: "short" });
      const ano = d.getFullYear();
      const mesNum = d.getMonth();
      const abertosM = chamados.filter(t => {
        const dt = new Date(t.criadoEm);
        return dt.getMonth() === mesNum && dt.getFullYear() === ano;
      }).length;
      const resolvidosM = concluidos.filter(t => {
        const dt = new Date(t.atualizadoEm);
        return dt.getMonth() === mesNum && dt.getFullYear() === ano;
      }).length;
      return { mes: mes.charAt(0).toUpperCase() + mes.slice(1), abertos: abertosM, resolvidos: resolvidosM };
    });

    return { taxaCumprimento, tempoMedioH, porPrioridade, satisfacao, statusDist, porSistema, reincidentes, volumeMensal, dentroSlaCount: dentroSla.length, totalComSla: concluidosComSla.length };
  }, [chamados, concluidos, slaVencidoCount]);

  const rankingTecnicos = useMemo(() => {
    const tecnicoMap: Record<string, { total: number; resolvidos: number; tempoTotal: number; dentroSla: number; comSla: number; reincidentes: number; abertos: number }> = {};
    chamados.forEach(t => {
      if (!t.responsavelId) return;
      if (!tecnicoMap[t.responsavelId]) tecnicoMap[t.responsavelId] = { total: 0, resolvidos: 0, tempoTotal: 0, dentroSla: 0, comSla: 0, reincidentes: 0, abertos: 0 };
      const m = tecnicoMap[t.responsavelId];
      m.total++;
      if (t.reincidente) m.reincidentes++;
      if (t.status === "concluida") {
        m.resolvidos++;
        m.tempoTotal += t.tempoTotalSegundos;
        if (t.slaHoras && t.criadoEm) {
          m.comSla++;
          const deadline = new Date(new Date(t.criadoEm).getTime() + t.slaHoras * 3600000);
          if (new Date(t.atualizadoEm) <= deadline) m.dentroSla++;
        }
      } else if (t.status !== "cancelada") {
        m.abertos++;
      }
    });
    return Object.entries(tecnicoMap)
      .map(([id, m]) => ({
        id,
        nome: getTecnico(id)?.nome || "Desconhecido",
        ...m,
        tempoMedioH: m.resolvidos > 0 ? m.tempoTotal / m.resolvidos / 3600 : 0,
        taxaSla: m.comSla > 0 ? Math.round((m.dentroSla / m.comSla) * 100) : 100,
        score: m.resolvidos * 10 + (m.comSla > 0 ? (m.dentroSla / m.comSla) * 30 : 30) - m.reincidentes * 5,
      }))
      .sort((a, b) => b.score - a.score);
  }, [chamados, getTecnico]);

  return { slaMetrics, rankingTecnicos };
}
