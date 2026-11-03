import { describe, expect, test } from "vitest";
import { resumenDTO } from "@/features/health/dto";
import {
  advertenciasTexto,
  aporteTexto,
  conteoGeneral,
  contarCumplimiento,
  metricasDeEtapa,
  puntosTexto,
  resumenCumplimiento,
  saludTexto,
} from "@/features/health/lib";
import { valorActualTexto } from "@/features/metrics/lib/formato";
import { saludJson } from "./helpers/salud";

const pid = "00000000-0000-4000-a000-000000000001";
const sinEvaluar = saludJson();
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
    cumplimientoCritico: codigo === "M-01" ? "Sin medición" : null,
    aporte: null,
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
  // 100 × (1 + 1) / (3 + 3) = 33.33 %.
  salud: saludJson({ na: 3, aa: 1, nm: 3, sinDatos: 2, porcentaje: "33.33", clasificacion: "Malo", puntos: "2", advertencias: ["EVALUACION_PARCIAL"] }),
  etapas: [
    {
      codigo: "requerimientos",
      nombre: "Especificación de requerimientos",
      salud: saludJson({ na: 2, aa: 1, porcentaje: "50.00", clasificacion: "Regular", puntos: "1" }),
      conteos: { ...cero, Pendiente: 1, Aprobada: 1 },
      actividades: [
        {
          id: "00000000-0000-4000-a000-000000000301",
          tipoCodigo: "A-01",
          tipoNombre: "Revisión de documentación de requisitos",
          instancia: 1,
          responsableNombre: null,
          estado: "Pendiente",
          evidencias: [],
        },
        {
          id: "00000000-0000-4000-a000-000000000302",
          tipoCodigo: "A-01",
          tipoNombre: "Revisión de documentación de requisitos",
          instancia: 2,
          responsableNombre: "Miembro 1",
          estado: "Aprobada",
          evidencias: [
            { id: "00000000-0000-4000-a000-000000000401", tipo: "PDF", nombre: "informe.pdf", url: null },
            { id: "00000000-0000-4000-a000-000000000402", tipo: "Enlace", nombre: null, url: "https://example.test/revision" },
          ],
        },
      ],
    },
    { codigo: "diseno", nombre: "Diseño del software", salud: sinEvaluar, conteos: cero, actividades: [] },
    {
      codigo: "desarrollo",
      nombre: "Desarrollo",
      salud: saludJson({ na: 1, nm: 3, sinDatos: 2, porcentaje: "25.00", clasificacion: "Malo", puntos: "1", advertencias: ["EVALUACION_PARCIAL"] }),
      conteos: { ...cero, "En revisión": 1 },
      actividades: [
        {
          id: "00000000-0000-4000-a000-000000000303",
          tipoCodigo: "A-05",
          tipoNombre: "Análisis estático automático de código",
          instancia: 1,
          responsableNombre: "Miembro 2",
          estado: "En revisión",
          evidencias: [],
        },
      ],
    },
  ],
  metricas: [
    metrica("M-02", {
      valorActual: "95.00000000",
      condicionPrincipal: "Evaluable",
      cumplimiento: "Cumple",
      aporte: "1.00000000",
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
  test("adapta proyecto, tres etapas en orden fijo, salud calculada por la BD y evidencias", () => {
    const r = resumenDTO(json);
    expect(r.proyecto).toEqual(json.proyecto);
    expect(r.generadoEn).toBe(json.generadoEn);
    expect(r.salud).toMatchObject({ estado: "Evaluada", porcentaje: "33.33", clasificacion: "Malo", posibles: 6 });
    expect(r.etapas.map((e) => e.codigo)).toEqual(["requisitos", "diseno", "desarrollo"]);
    expect(r.etapas.map((e) => e.salud.estado)).toEqual(["Evaluada", "Sin evaluar", "Evaluada"]);
    expect(r.etapas[1]!.salud).toMatchObject({ porcentaje: null, clasificacion: null, advertencias: ["SIN_ELEMENTOS"] });
    expect(r.etapas[0]!.actividades[0]!.responsableNombre).toBeNull();
    // Evidencias del último intento enviado: referencias, sin campos nulos sobrantes.
    expect(r.etapas[0]!.actividades[1]!.instancia).toBe(2);
    expect(r.etapas[0]!.actividades[1]!.evidencias).toEqual([
      { id: "00000000-0000-4000-a000-000000000401", tipo: "PDF", nombre: "informe.pdf" },
      { id: "00000000-0000-4000-a000-000000000402", tipo: "Enlace", url: "https://example.test/revision" },
    ]);
    // Serializable tal cual para la captura de CU-06.
    expect(JSON.parse(JSON.stringify(r))).toEqual(r);
  });

  test("redacta porcentaje, clasificación, puntos, aportes y advertencias sin recalcular", () => {
    const r = resumenDTO(json);
    expect(saludTexto(r.salud)).toBe("33.33 % · Malo");
    expect(saludTexto(r.etapas[1]!.salud)).toBe("Sin evaluar");
    expect(puntosTexto(r.salud)).toBe("2 de 6 puntos");
    expect(advertenciasTexto(r.salud)).toEqual([
      "Evaluación parcial: 2 métricas sin medición o no evaluable aporta 0 y sigue contando como punto posible.",
    ]);
    expect(advertenciasTexto(r.etapas[1]!.salud)[0]).toContain("no hay elementos que evaluar");
    expect(aporteTexto(r.metricas[0]!.aporte)).toBe("1.00 de 1");
    expect(aporteTexto("0.80000000")).toBe("0.80 de 1");
    // Ausencia de datos no se presenta como un aporte numérico medido.
    expect(aporteTexto(null)).toBe("0 (sin datos)");
    const defectos = resumenDTO({
      ...json,
      salud: { ...json.salud, advertencias: ["DEFECTOS_GRAVES"] },
    });
    expect(advertenciasTexto(defectos.salud)[0]).toContain("No limita la puntuación");
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

  test("rechaza salud incoherente o no aprobada (DEC-30: error, no cifras dudosas)", () => {
    // Clasificación fuera del catálogo aprobado.
    expect(() => resumenDTO({ ...json, salud: { ...json.salud, clasificacion: "Aceptable" } })).toThrow();
    // Evaluada sin porcentaje, Sin evaluar con elementos, porcentaje fuera de rango.
    expect(() => resumenDTO({ ...json, salud: { ...json.salud, porcentaje: null } })).toThrow();
    expect(() => resumenDTO({ ...json, salud: { ...json.salud, estado: "Sin evaluar" } })).toThrow();
    expect(() => resumenDTO({ ...json, salud: { ...json.salud, porcentaje: "100.01" } })).toThrow();
    // N_A + N_M no corresponde a los elementos mostrados.
    expect(() => resumenDTO({ ...json, salud: { ...json.salud, posibles: 5 } })).toThrow();
    expect(() =>
      resumenDTO({ ...json, salud: { ...json.salud, actividades: { total: 3, aprobadas: 2 } } }),
    ).toThrow();
    expect(() =>
      resumenDTO({
        ...json,
        etapas: [json.etapas[0], { ...json.etapas[1]!, salud: saludJson({ na: 1, porcentaje: "0.00" }) }, json.etapas[2]],
      }),
    ).toThrow();
    // Campos extra no llegan a la vista ni al reporte.
    expect(resumenDTO({ ...json, salud: { ...json.salud, puntaje: 80 } }).salud).not.toHaveProperty("puntaje");
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
