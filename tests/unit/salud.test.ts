import { describe, expect, test } from "vitest";
import { resumenDTO } from "@/features/health/dto";
import {
  conteoGeneral,
  contarCumplimiento,
  metricasDeEtapa,
  resumenCumplimiento,
} from "@/features/health/lib";
import { valorActualTexto } from "@/features/metrics/lib/formato";

const pid = "00000000-0000-4000-a000-000000000001";
const sinEvaluar = { estado: "Sin evaluar", motivo: "Algoritmo pendiente" };
const cero = { Pendiente: 0, "En progreso": 0, "En revisión": 0, Aprobada: 0 };

function metrica(codigo: string, extra: Record<string, unknown> = {}) {
  return {
    id: `00000000-0000-4000-a000-00000000010${codigo.slice(-1)}`,
    proyectoId: pid,
    tipo: {
      id: `00000000-0000-4000-a000-00000000020${codigo.slice(-1)}`,
      codigo,
      nombre: `Métrica ${codigo}`,
      etapaCodigo: "desarrollo",
      unidad: codigo === "M-04" ? "defectos" : "%",
    },
    operador: codigo === "M-04" ? "<=" : ">=",
    objetivo: codigo === "M-04" ? "0" : "90.00000000",
    objetivoCritico: codigo === "M-01" ? "100.00000000" : null,
    valorActual: null,
    condicionPrincipal: "Sin medición",
    causa: null,
    cumplimiento: "No evaluable",
    valorCritico: null,
    condicionCritica: "Sin medición",
    causaCritica: null,
    medidaEn: null,
    configuradaEn: "2026-10-19T20:39:33.117978+00:00",
    ...extra,
  };
}

/** Forma de `public.consultar_resumen` (contratos v1 §6). */
const json = {
  proyecto: {
    id: pid,
    nombre: "Proyecto de salud",
    descripcion: "Fixture",
    periodoAcademico: null,
    fechaInicio: "2026-10-01",
    fechaFinPrevista: null,
    cerradoEn: null,
  },
  generadoEn: "2026-10-20T10:00:00.123456+00:00",
  salud: sinEvaluar,
  etapas: [
    {
      codigo: "requerimientos",
      nombre: "Especificación de requerimientos",
      salud: sinEvaluar,
      conteos: { ...cero, Pendiente: 1, Aprobada: 1 },
      actividades: [
        {
          id: "00000000-0000-4000-a000-000000000301",
          tipoCodigo: "A-01",
          tipoNombre: "Revisión de la documentación de requisitos",
          responsableNombre: null,
          estado: "Pendiente",
        },
        {
          id: "00000000-0000-4000-a000-000000000302",
          tipoCodigo: "A-01",
          tipoNombre: "Revisión de la documentación de requisitos",
          responsableNombre: "Miembro 1",
          estado: "Aprobada",
        },
      ],
    },
    { codigo: "diseno", nombre: "Diseño del software", salud: sinEvaluar, conteos: cero, actividades: [] },
    {
      codigo: "desarrollo",
      nombre: "Desarrollo",
      salud: sinEvaluar,
      conteos: { ...cero, "En revisión": 1 },
      actividades: [
        {
          id: "00000000-0000-4000-a000-000000000303",
          tipoCodigo: "A-05",
          tipoNombre: "Análisis de código estático automático",
          responsableNombre: "Miembro 2",
          estado: "En revisión",
        },
      ],
    },
  ],
  metricas: [
    metrica("M-02", {
      valorActual: "95.00000000",
      condicionPrincipal: "Evaluable",
      cumplimiento: "Cumple",
      medidaEn: "2026-10-10T00:00:00+00:00",
    }),
    metrica("M-03", {
      condicionPrincipal: "No evaluable",
      causa: "Denominador cero",
      medidaEn: "2026-10-05T00:00:00+00:00",
    }),
    metrica("M-04"),
  ],
};

describe("CU-05: resumen de salud", () => {
  test("adapta proyecto, tres etapas en orden fijo, actividades y salud Sin evaluar", () => {
    const r = resumenDTO(json);
    expect(r.proyecto).toEqual(json.proyecto);
    expect(r.generadoEn).toBe(json.generadoEn);
    expect(r.salud).toEqual(sinEvaluar);
    expect(r.etapas.map((e) => e.codigo)).toEqual(["requisitos", "diseno", "desarrollo"]);
    expect(r.etapas.every((e) => e.salud.estado === "Sin evaluar")).toBe(true);
    expect(r.etapas[0]!.actividades[0]).toEqual(json.etapas[0]!.actividades[0]);
    expect(r.etapas[0]!.actividades[0]!.responsableNombre).toBeNull();
    // Sin porcentajes, puntajes ni categorías: solo estado y motivo.
    expect(Object.keys(r.salud)).toEqual(["estado", "motivo"]);
    // Serializable tal cual para la captura de CU-06.
    expect(JSON.parse(JSON.stringify(r))).toEqual(r);
  });

  test("métrica sin medición es «Sin medición», no cero; No evaluable conserva su causa", () => {
    const r = resumenDTO(json);
    const [m2, m3, m4] = r.metricas;
    expect(m2).toMatchObject({ cumplimiento: "Cumple", valorActual: "95.00000000" });
    expect(valorActualTexto(m2!)).toBe("95.00 %");
    expect(m3).toMatchObject({ cumplimiento: "No evaluable", causa: "Denominador cero" });
    expect(valorActualTexto(m3!)).toBe("No disponible");
    expect(m4).toMatchObject({ cumplimiento: "Sin medición", valorActual: null, medidaEn: null });
    expect(valorActualTexto(m4!)).toBe("Sin medición");
  });

  test("conteos y cumplimiento agrupan sin calcular salud", () => {
    const r = resumenDTO(json);
    expect(conteoGeneral(r)).toEqual({ Pendiente: 1, "En progreso": 0, "En revisión": 1, Aprobada: 1 });
    expect(contarCumplimiento(r.metricas)).toEqual({
      Cumple: 1,
      Incumple: 0,
      "No evaluable": 1,
      "Sin medición": 1,
    });
    expect(resumenCumplimiento(r.metricas)).toBe("1 Cumple · 1 No evaluable · 1 Sin medición");
    expect(metricasDeEtapa(r.metricas, "desarrollo")).toHaveLength(3);
    expect(metricasDeEtapa(r.metricas, "requisitos")).toEqual([]);
  });

  test("rechaza respuestas incompletas o con una clasificación de salud no aprobada", () => {
    expect(() => resumenDTO({ ...json, salud: { estado: "Bueno", motivo: "Algoritmo pendiente" } })).toThrow();
    // Campos extra (p. ej. un puntaje) no llegan a la vista ni al reporte.
    expect(resumenDTO({ ...json, salud: { ...sinEvaluar, puntaje: 80 } }).salud).toEqual(sinEvaluar);
    expect(() =>
      resumenDTO({ ...json, etapas: [json.etapas[0], { ...json.etapas[2]!, salud: { estado: "Excelente" } }] }),
    ).toThrow();
    expect(() => resumenDTO({ ...json, etapas: json.etapas.slice(0, 2) })).toThrow();
    expect(() => resumenDTO({ ...json, etapas: [...json.etapas].reverse() })).toThrow();
    expect(() =>
      resumenDTO({
        ...json,
        etapas: [{ ...json.etapas[0]!, conteos: { ...cero, Pendiente: -1 } }, ...json.etapas.slice(1)],
      }),
    ).toThrow();
    expect(() =>
      resumenDTO({
        ...json,
        etapas: [
          { ...json.etapas[0]!, actividades: [{ ...json.etapas[0]!.actividades[0]!, estado: "Cerrada" }] },
          ...json.etapas.slice(1),
        ],
      }),
    ).toThrow();
    expect(() => resumenDTO({ ...json, metricas: [metrica("M-99")] })).toThrow();
    expect(() => resumenDTO(null)).toThrow();
  });
});
