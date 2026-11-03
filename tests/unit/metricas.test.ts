import { describe, expect, test } from "vitest";
import { validar } from "@/features/projects/validation";
import {
  agregarMetricaSchema,
  configurarObjetivoSchema,
  corregirMedicionSchema,
  crearCursorMediciones,
  datosFuenteDeTipo,
  leerCursorMediciones,
  listarCorreccionesSchema,
  medidaEnISO,
  objetivosDeTipo,
  registrarMedicionSchema,
} from "@/features/metrics/validation";
import { metricaDTO } from "@/features/metrics/dto";
import { seraVigente } from "@/features/metrics/lib/calculo";
import { valorActualTexto } from "@/features/metrics/lib/formato";
import { TIPOS_METRICA } from "@/lib/catalogs";
import { ErrorOperacion } from "@/lib/resultados";
const id = "00000000-0000-4000-a000-000000000001";
const otro = "00000000-0000-4000-a000-000000000002";
const tipo = (codigo: string) => TIPOS_METRICA.find((t) => t.codigo === codigo)!;
function campos(fn: () => unknown) {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(ErrorOperacion);
    expect((e as ErrorOperacion).codigo).toBe("DATOS_INVALIDOS");
    return (e as ErrorOperacion).campos ?? {};
  }
  throw new Error("Se esperaba DATOS_INVALIDOS");
}

describe("CU-02: entradas de métricas y mediciones", () => {
  test("objetivos por tipo: M-01 exige crítico, el resto no lo admite y M-04 es entero", () => {
    expect(objetivosDeTipo(tipo("M-01"), " 97.5 ", "100")).toEqual({
      objetivo: "97.5",
      objetivoCritico: "100",
    });
    expect(objetivosDeTipo(tipo("M-04"), "0", null)).toEqual({
      objetivo: "0",
      objetivoCritico: null,
    });
    expect(campos(() => objetivosDeTipo(tipo("M-01"), "90", null))).toHaveProperty("objetivoCritico");
    expect(campos(() => objetivosDeTipo(tipo("M-02"), "100", "100"))).toHaveProperty("objetivoCritico");
    for (const malo of ["100.0001", "-1", "1e2", "90.12345", "", "NaN"])
      expect(campos(() => objetivosDeTipo(tipo("M-03"), malo, null))).toHaveProperty("objetivo");
    for (const malo of ["0.5", "2000000001", "-0"])
      expect(campos(() => objetivosDeTipo(tipo("M-04"), malo, null))).toHaveProperty("objetivo");
  });

  test("datos fuente: claves exactas del catálogo, enteros y fuente opcional recortada (DEC-26)", () => {
    expect(
      datosFuenteDeTipo(
        tipo("M-02"),
        { integrados_revisados: " 3 ", integrados: "4" },
        "  https://example.test/pulls  ",
      ),
    ).toEqual({
      integrados_revisados: 3,
      integrados: 4,
      fuente_referencia: "https://example.test/pulls",
    });
    expect(
      campos(() =>
        datosFuenteDeTipo(tipo("M-02"), { integrados_revisados: "1", integrados: "1", valor: "100" }, "ci"),
      ),
    ).toHaveProperty("formulario");
    expect(campos(() => datosFuenteDeTipo(tipo("M-02"), { integrados: "1" }, "ci"))).toHaveProperty(
      "integrados_revisados",
    );
    expect(
      campos(() => datosFuenteDeTipo(tipo("M-03"), { requisitos_probados: "5", requisitos_definidos: "4" }, "x")),
    ).toHaveProperty("requisitos_probados");
    expect(
      campos(() =>
        datosFuenteDeTipo(tipo("M-04"), { criticos_abiertos: "1.5", altos_abiertos: "1000000001" }, "x"),
      ),
    ).toMatchObject({ criticos_abiertos: expect.any(String), altos_abiertos: expect.any(String) });
    // Fuente vacía o solo espacios: se omite la clave, no se rechaza.
    expect(datosFuenteDeTipo(tipo("M-04"), { criticos_abiertos: "0", altos_abiertos: "0" }, "   ")).toEqual({
      criticos_abiertos: 0,
      altos_abiertos: 0,
    });
    expect(
      campos(() =>
        datosFuenteDeTipo(tipo("M-04"), { criticos_abiertos: "0", altos_abiertos: "0" }, "x".repeat(2049)),
      ),
    ).toHaveProperty("fuenteReferencia");
  });

  test("M-01 valida la relación entre pruebas críticas y no críticas; denominador 0 se admite", () => {
    const m01 = tipo("M-01");
    const d = (a: number, e: number, ca: number, ce: number) => ({
      aprobadas: String(a),
      ejecutadas: String(e),
      criticas_aprobadas: String(ca),
      criticas_ejecutadas: String(ce),
    });
    expect(datosFuenteDeTipo(m01, d(0, 0, 0, 0), "ci")).toMatchObject({ ejecutadas: 0 });
    expect(datosFuenteDeTipo(m01, d(9, 10, 2, 2), "ci")).toMatchObject({ aprobadas: 9 });
    for (const malo of [d(11, 10, 0, 0), d(5, 10, 3, 2), d(5, 10, 0, 11), d(9, 10, 0, 2)])
      expect(Object.keys(campos(() => datosFuenteDeTipo(m01, malo, "ci"))).length).toBeGreaterThan(0);
  });

  test("esquemas estrictos: sin valor/cumplimiento de entrada y con token de configuración exacto", () => {
    const base = { medicionId: id, metricaProyectoId: otro, medidaEn: "2026-10-05", conteos: {}, fuenteReferencia: "x" };
    expect(validar(registrarMedicionSchema, base)).toEqual(base);
    for (const extra of [{ valor: "100" }, { cumplimiento: "Cumple" }, { medidaEn: "2026-02-30" }, { medicionId: "m-1" }])
      expect(() => validar(registrarMedicionSchema, { ...base, ...extra })).toThrow(ErrorOperacion);
    expect(() =>
      validar(corregirMedicionSchema, { medicionId: id, revisionEsperada: 1, conteos: {}, fuenteReferencia: "x", medidaEn: "2026-10-01" }),
    ).toThrow(ErrorOperacion);
    for (const revisionEsperada of [0, 1.5, "1"])
      expect(() =>
        validar(corregirMedicionSchema, { medicionId: id, revisionEsperada, conteos: {}, fuenteReferencia: "x" }),
      ).toThrow(ErrorOperacion);
    const token = "2026-10-19T20:39:33.117978+00:00";
    expect(
      validar(configurarObjetivoSchema, {
        metricaProyectoId: id,
        configuradaEnEsperada: token,
        objetivo: "90",
        objetivoCritico: null,
      }).configuradaEnEsperada,
    ).toBe(token);
    expect(() =>
      validar(configurarObjetivoSchema, { metricaProyectoId: id, configuradaEnEsperada: "ayer", objetivo: "90", objetivoCritico: null }),
    ).toThrow(ErrorOperacion);
    expect(() => validar(agregarMetricaSchema, { proyectoId: id, tipoId: "tm-01", objetivo: "90", objetivoCritico: null })).toThrow(
      ErrorOperacion,
    );
    expect(() => validar(listarCorreccionesSchema, { medicionId: id, cursor: 1 })).toThrow(ErrorOperacion);
  });

  test("fecha de medición a medianoche UTC y cursor de historial validado", () => {
    expect(medidaEnISO("2026-10-05")).toBe("2026-10-05T00:00:00Z");
    const c = crearCursorMediciones("2026-10-05T00:00:00+00:00", "42");
    expect(leerCursorMediciones(c)).toEqual({ fecha: "2026-10-05T00:00:00+00:00", orden: "42" });
    for (const malo of [
      "no es base64!",
      Buffer.from(JSON.stringify({ fecha: "2026-10-05", orden: "1" })).toString("base64url"),
      Buffer.from(JSON.stringify({ fecha: "2026-10-05T00:00:00Z", orden: "1 or 1=1" })).toString("base64url"),
    ])
      expect(() => leerCursorMediciones(malo)).toThrow(ErrorOperacion);
  });
});

describe("CU-02: lectura de la métrica", () => {
  const json = {
    id,
    proyectoId: otro,
    tipo: { id: otro, codigo: "M-01", nombre: "Tasa de pruebas aprobadas", etapaCodigo: "desarrollo", unidad: "%" },
    operador: ">=",
    objetivo: "90.00000000",
    objetivoCritico: "100.00000000",
    valorActual: null,
    condicionPrincipal: "Sin medición",
    causa: null,
    cumplimiento: "No evaluable",
    valorCritico: null,
    condicionCritica: "Sin medición",
    causaCritica: null,
    cumplimientoCritico: "Sin medición",
    aporte: null,
    medidaEn: null,
    configuradaEn: "2026-10-19T20:39:33.117978+00:00",
  };
  test("sin medición no es cero ni cumplimiento; conserva el token y adapta la etapa", () => {
    const m = metricaDTO(json);
    expect(m.cumplimiento).toBe("Sin medición");
    expect(valorActualTexto(m)).toBe("Sin medición");
    expect(m.configuradaEn).toBe(json.configuradaEn);
    expect(m.tipo).toMatchObject({ id: otro, etapaCodigo: "desarrollo", campos: tipo("M-01").campos });
    expect(seraVigente(m, "2020-01-01")).toBe(true);
  });
  test("medición No evaluable conserva la condición y no muestra un valor", () => {
    const m = metricaDTO({
      ...json,
      condicionPrincipal: "No evaluable",
      causa: "Denominador cero",
      condicionCritica: "No evaluable",
      causaCritica: "Sin muestra crítica",
      medidaEn: "2026-10-05T00:00:00+00:00",
    });
    expect(m.cumplimiento).toBe("No evaluable");
    expect(m.aporte).toBeNull();
    expect(valorActualTexto(m)).toBe("No disponible");
    expect(seraVigente(m, "2026-10-05")).toBe(true);
    expect(seraVigente(m, "2026-10-04")).toBe(false);
  });
  test("M-01: cumplimiento general separado del criterio crítico y aporte a salud (DEC-26/27)", () => {
    const m = metricaDTO({
      ...json,
      valorActual: "95.00000000",
      condicionPrincipal: "Evaluable",
      cumplimiento: "Cumple",
      condicionCritica: "No evaluable",
      causaCritica: "Sin muestra crítica",
      cumplimientoCritico: "No evaluable",
      aporte: "1.00000000",
      medidaEn: "2026-10-05T00:00:00+00:00",
    });
    expect(m).toMatchObject({ cumplimiento: "Cumple", cumplimientoCritico: "No evaluable", aporte: "1.00000000" });
  });
  test("rechaza respuestas con forma inesperada", () => {
    expect(() => metricaDTO({ ...json, cumplimiento: "Parcial" })).toThrow();
    expect(() => metricaDTO({ ...json, aporte: "-0.5" })).toThrow();
    expect(() => metricaDTO({ ...json, tipo: { ...json.tipo, codigo: "M-99" } })).toThrow();
  });
});
