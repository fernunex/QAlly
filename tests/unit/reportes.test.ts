import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const dobles = vi.hoisted(() => ({ sesion: vi.fn(), resumen: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/session", () => ({ obtenerSesion: dobles.sesion }));
vi.mock("@/features/health/server/queries", () => ({ consultarResumen: dobles.resumen }));
import { generarReporte } from "@/features/reports/actions";
import { ErrorOperacion } from "@/lib/resultados";
import { resumenDTO } from "@/features/health/dto";
import type { ResumenProyecto } from "@/features/health/types";
import {
  abrirCaptura,
  comprobarVigencia,
  emitirCaptura,
  LIMITE_CAPTURA,
  verificarCaptura,
  VIGENCIA_CAPTURA_MS,
} from "@/features/reports/server/captura";
import { LIMITE_PDF_REPORTE, renderizarReportePdf, textoPdf } from "@/features/reports/server/pdf";
import { modeloReporte, nombreArchivoReporte } from "@/features/reports/lib/modelo";

const pid = "00000000-0000-4000-a000-000000000001";
const otroProyecto = "00000000-0000-4000-a000-000000000002";
const qa = "00000000-0000-4000-a000-0000000000a1";
const otroQa = "00000000-0000-4000-a000-0000000000a2";
const sinEvaluar = { estado: "Sin evaluar", motivo: "Algoritmo pendiente" };
const cero = { Pendiente: 0, "En progreso": 0, "En revisión": 0, Aprobada: 0 };
const ahora = new Date("2026-10-20T10:00:00.000Z");

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

function actividades(n: number, estado = "Pendiente") {
  return Array.from({ length: n }, (_, i) => ({
    id: `00000000-0000-4000-a000-${String(i).padStart(12, "0")}`,
    tipoCodigo: "A-05",
    tipoNombre: "Análisis de código estático automático",
    responsableNombre: i % 2 ? `Persona de prueba ${i}` : null,
    estado,
  }));
}

function resumen(extra: { descripcion?: string; desarrollo?: number } = {}): ResumenProyecto {
  const n = extra.desarrollo ?? 1;
  return resumenDTO({
    proyecto: {
      id: pid,
      nombre: "Proyecto Ñandú: calidad/2026",
      descripcion: extra.descripcion ?? "Fixture de CU-06",
      periodoAcademico: "2026-2",
      fechaInicio: "2026-10-01",
      fechaFinPrevista: null,
      cerradoEn: null,
    },
    generadoEn: "2026-10-20T09:59:59.900000+00:00",
    salud: sinEvaluar,
    etapas: [
      {
        codigo: "requerimientos",
        nombre: "Especificación de requerimientos",
        salud: sinEvaluar,
        conteos: { ...cero, Aprobada: 1 },
        actividades: actividades(1, "Aprobada"),
      },
      { codigo: "diseno", nombre: "Diseño del software", salud: sinEvaluar, conteos: cero, actividades: [] },
      {
        codigo: "desarrollo",
        nombre: "Desarrollo",
        salud: sinEvaluar,
        conteos: { ...cero, Pendiente: n },
        actividades: actividades(n),
      },
    ],
    metricas: [
      metrica("M-01", { objetivoCritico: "100.00000000" }),
      metrica("M-02", {
        valorActual: "95.00000000",
        condicionPrincipal: "Evaluable",
        cumplimiento: "Cumple",
        medidaEn: "2026-10-10T00:00:00+00:00",
      }),
      metrica("M-04"),
    ],
  });
}

/** Cambia un carácter base64url del segmento indicado sin romper el formato. */
function alterar(token: string, segmento: number) {
  const partes = token.split(".");
  const s = partes[segmento]!;
  const i = Math.floor(s.length / 2);
  partes[segmento] = s.slice(0, i) + (s[i] === "A" ? "B" : "A") + s.slice(i + 1);
  return partes.join(".");
}

const clave = randomBytes(32).toString("base64");
beforeEach(() => vi.stubEnv("REPORT_SNAPSHOT_KEY_BASE64", clave));
afterEach(() => vi.unstubAllEnvs());

describe("CU-06: captura cifrada del reporte", () => {
  test("cifra y descifra la captura completa con formato v1.iv.ciphertext.tag", () => {
    const r = resumen();
    const c = emitirCaptura({ usuarioId: qa, proyectoId: pid, resumen: r }, ahora);
    expect(c.emitidaEn).toBe("2026-10-20T10:00:00.000Z");
    expect(Date.parse(c.venceEn) - Date.parse(c.emitidaEn)).toBe(VIGENCIA_CAPTURA_MS);
    const [v, iv, cifrado, tag, ...resto] = c.token.split(".");
    expect(v).toBe("v1");
    expect(resto).toEqual([]);
    expect(Buffer.from(iv!, "base64url")).toHaveLength(12);
    expect(Buffer.from(tag!, "base64url")).toHaveLength(16);
    expect(cifrado).toMatch(/^[A-Za-z0-9_-]+$/);
    // El token no expone el contenido en claro.
    expect(c.token).not.toContain("Proyecto");
    expect(Buffer.from(cifrado!, "base64url").toString("utf8")).not.toContain(pid);

    const p = abrirCaptura(c.token, { usuarioId: qa, proyectoId: pid }, ahora);
    expect(p).toEqual({ version: 1, usuarioId: qa, proyectoId: pid, emitidaEn: c.emitidaEn, venceEn: c.venceEn, resumen: r });
  });

  test("cada captura usa un nonce aleatorio distinto", () => {
    const r = resumen();
    const a = emitirCaptura({ usuarioId: qa, proyectoId: pid, resumen: r }, ahora);
    const b = emitirCaptura({ usuarioId: qa, proyectoId: pid, resumen: r }, ahora);
    expect(a.token.split(".")[1]).not.toBe(b.token.split(".")[1]);
    expect(a.token).not.toBe(b.token);
  });

  test("rechaza tokens alterados, mal formados o cifrados con otra clave", () => {
    const { token } = emitirCaptura({ usuarioId: qa, proyectoId: pid, resumen: resumen() }, ahora);
    const invalidos = [
      alterar(token, 1),
      alterar(token, 2),
      alterar(token, 3),
      token.replace(/^v1\./, "v2."),
      token.split(".").slice(0, 3).join("."),
      `${token}.extra`,
      token.replace(/\.[^.]+$/, ".no+es/base64url="),
      "",
      "v1...",
    ];
    for (const t of invalidos)
      expect(() => abrirCaptura(t, { usuarioId: qa }, ahora), t.slice(0, 20)).toThrow(
        expect.objectContaining({ codigo: "DATOS_INVALIDOS" }),
      );
    vi.stubEnv("REPORT_SNAPSHOT_KEY_BASE64", randomBytes(32).toString("base64"));
    expect(() => abrirCaptura(token, { usuarioId: qa }, ahora)).toThrow(
      expect.objectContaining({ codigo: "DATOS_INVALIDOS" }),
    );
  });

  test("vence a los 15 minutos con CAPTURA_EXPIRADA solo si es íntegra y propia", () => {
    const { token } = emitirCaptura({ usuarioId: qa, proyectoId: pid, resumen: resumen() }, ahora);
    const casi = new Date(ahora.getTime() + VIGENCIA_CAPTURA_MS - 1);
    const vencida = new Date(ahora.getTime() + VIGENCIA_CAPTURA_MS);
    expect(abrirCaptura(token, { usuarioId: qa }, casi).proyectoId).toBe(pid);
    expect(() => abrirCaptura(token, { usuarioId: qa }, vencida)).toThrow(
      expect.objectContaining({ codigo: "CAPTURA_EXPIRADA" }),
    );
    // Vencida y ajena: el mismo rechazo genérico, sin revelar que existió.
    expect(() => abrirCaptura(token, { usuarioId: otroQa }, vencida)).toThrow(
      expect.objectContaining({ codigo: "DATOS_INVALIDOS" }),
    );
    expect(() => abrirCaptura(alterar(token, 2), { usuarioId: qa }, vencida)).toThrow(
      expect.objectContaining({ codigo: "DATOS_INVALIDOS" }),
    );
    // La verificación sin vigencia permite comprobar participación antes de informar 410.
    const c = verificarCaptura(token, { usuarioId: qa });
    expect(() => comprobarVigencia(c, vencida)).toThrow(expect.objectContaining({ codigo: "CAPTURA_EXPIRADA" }));
  });

  test("rechaza la captura de otro usuario o de otro proyecto", () => {
    const { token } = emitirCaptura({ usuarioId: qa, proyectoId: pid, resumen: resumen() }, ahora);
    expect(() => abrirCaptura(token, { usuarioId: otroQa }, ahora)).toThrow(
      expect.objectContaining({ codigo: "DATOS_INVALIDOS" }),
    );
    expect(() => abrirCaptura(token, { usuarioId: qa, proyectoId: otroProyecto }, ahora)).toThrow(
      expect.objectContaining({ codigo: "DATOS_INVALIDOS" }),
    );
    // No se emite una captura cuyo resumen pertenece a otro proyecto.
    expect(() => emitirCaptura({ usuarioId: qa, proyectoId: otroProyecto, resumen: resumen() }, ahora)).toThrow();
  });

  test("límite de 1 MiB del JSON: TAMANO_EXCEDIDO sin truncar", () => {
    const base = JSON.stringify({
      version: 1,
      usuarioId: qa,
      proyectoId: pid,
      emitidaEn: ahora.toISOString(),
      venceEn: new Date(ahora.getTime() + VIGENCIA_CAPTURA_MS).toISOString(),
      resumen: resumen({ descripcion: "" }),
    });
    const libre = LIMITE_CAPTURA - Buffer.byteLength(base, "utf8");
    // Justo en el límite (bytes UTF-8, no caracteres): se acepta íntegra.
    const exacta = resumen({ descripcion: "x".repeat(libre) });
    const ok = emitirCaptura({ usuarioId: qa, proyectoId: pid, resumen: exacta }, ahora);
    expect(abrirCaptura(ok.token, { usuarioId: qa }, ahora).resumen.proyecto.descripcion).toHaveLength(libre);
    // Un byte más (ñ ocupa 2 bytes): se rechaza sin recortar.
    const excedida = resumen({ descripcion: `${"x".repeat(libre - 1)}ñ` });
    expect(() => emitirCaptura({ usuarioId: qa, proyectoId: pid, resumen: excedida }, ahora)).toThrow(
      expect.objectContaining({ codigo: "TAMANO_EXCEDIDO" }),
    );
  });

  test("sin clave válida de 32 bytes no se emite ni se abre ninguna captura", () => {
    const r = resumen();
    const { token } = emitirCaptura({ usuarioId: qa, proyectoId: pid, resumen: r }, ahora);
    for (const valor of ["", randomBytes(16).toString("base64")]) {
      vi.stubEnv("REPORT_SNAPSHOT_KEY_BASE64", valor);
      expect(() => emitirCaptura({ usuarioId: qa, proyectoId: pid, resumen: r }, ahora)).toThrow("FALLO_PERSISTENCIA");
      expect(() => abrirCaptura(token, { usuarioId: qa }, ahora)).toThrow("FALLO_PERSISTENCIA");
    }
  });
});

describe("CU-06: contenido del reporte y PDF", () => {
  test("el modelo muestra Sin medición, Sin evaluar y las tres etapas sin calcular salud", () => {
    const m = modeloReporte(resumen(), "2026-10-20T10:00:00.000Z");
    expect(m.fechaGeneracion).toBe("20 oct 2026, 10:00 (UTC)");
    expect(m.proyecto).toMatchObject({ periodoAcademico: "2026-2", estado: "Abierto", fechas: "01 oct 2026 – sin fin previsto" });
    const [m1, m2, m4] = m.metricas;
    expect(m1).toMatchObject({ ultimoValor: "Sin medición", estadoMedicion: "Sin medición (no equivale a 0)", fechaMedicion: "Sin fecha de medición" });
    expect(m1!.objetivo).toBe("general ≥ 90 % · críticas ≥ 100 %");
    expect(m2).toMatchObject({ ultimoValor: "95.00 %", cumplimientoTexto: "Cumple", fechaMedicion: "10 oct 2026" });
    expect(m4).toMatchObject({ ultimoValor: "Sin medición", cumplimiento: "Sin medición" });
    expect(m.etapas.map((e) => e.nombre)).toEqual(["Especificación de requerimientos", "Diseño del software", "Desarrollo"]);
    expect(m.etapas.map((e) => e.salud.estado)).toEqual(["Sin evaluar", "Sin evaluar", "Sin evaluar"]);
    expect(m.salud.general).toEqual(sinEvaluar);
    expect(m.actividades.total).toBe(2);
    expect(m.etapas[0]!.actividades[0]!.responsable).toBe("Sin responsable");
    expect(JSON.stringify(m)).not.toMatch(/Malo|Regular|Bueno|Excelente/);
  });

  test("nombre de archivo saneado y textos compatibles con la fuente estándar", () => {
    expect(nombreArchivoReporte("Proyecto Ñandú: calidad/2026", "2026-10-20T10:05:00.000Z")).toBe(
      "reporte-calidad-proyecto-nandu-calidad-2026-20261020-1005.pdf",
    );
    expect(nombreArchivoReporte('../"; rm', "2026-10-20T10:05:00.000Z")).toBe("reporte-calidad-rm-20261020-1005.pdf");
    expect(nombreArchivoReporte("¿?", "2026-10-20T10:05:00.000Z")).toBe("reporte-calidad-proyecto-20261020-1005.pdf");
    expect(textoPdf("general ≥ 90 % · ≤ 0 defectos")).toBe("general >= 90 % · <= 0 defectos");
  });

  test("genera un PDF válido dentro de 3 MiB, también con 1000 actividades", async () => {
    const pdf = await renderizarReportePdf(modeloReporte(resumen(), ahora.toISOString()));
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(pdf.subarray(-8).toString("latin1")).toContain("%%EOF");
    const grande = resumen({ desarrollo: 1000 });
    const captura = emitirCaptura({ usuarioId: qa, proyectoId: pid, resumen: grande }, ahora);
    const abierta = abrirCaptura(captura.token, { usuarioId: qa }, ahora);
    const pdfGrande = await renderizarReportePdf(modeloReporte(abierta.resumen, abierta.emitidaEn));
    expect(pdfGrande.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(pdfGrande.byteLength).toBeLessThan(LIMITE_PDF_REPORTE);
  });
});

describe("CU-06: generarReporte en el servidor", () => {
  const usuario = (rol: "QA" | "Miembro", id = qa) => ({ usuario: { id, rol, nombre: "X", nombreCorto: "X", correo: "" } });
  beforeEach(() => {
    dobles.sesion.mockReset();
    dobles.resumen.mockReset();
  });

  test("QA participante obtiene resumen, captura propia y vencimiento a 15 minutos", async () => {
    const r = resumen();
    dobles.sesion.mockResolvedValue(usuario("QA"));
    dobles.resumen.mockResolvedValue(r);
    const res = await generarReporte(pid);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(dobles.resumen).toHaveBeenCalledWith(pid);
    expect(res.datos.resumen).toBe(r);
    expect(Date.parse(res.datos.venceEn) - Date.parse(res.datos.emitidaEn)).toBe(VIGENCIA_CAPTURA_MS);
    const c = abrirCaptura(res.datos.capturaToken, { usuarioId: qa, proyectoId: pid });
    expect(c.emitidaEn).toBe(res.datos.emitidaEn);
    expect(c.resumen).toEqual(r);
  });

  test("Miembro del equipo no genera: PROHIBIDO sin consultar el proyecto", async () => {
    dobles.sesion.mockResolvedValue(usuario("Miembro"));
    const res = await generarReporte(pid);
    expect(res).toMatchObject({ ok: false, error: { codigo: "PROHIBIDO" } });
    expect(dobles.resumen).not.toHaveBeenCalled();
  });

  test("proyecto ajeno, inexistente o malformado: NO_DISPONIBLE; resumen excesivo: TAMANO_EXCEDIDO", async () => {
    dobles.sesion.mockResolvedValue(usuario("QA"));
    expect(await generarReporte("no-es-uuid")).toMatchObject({ ok: false, error: { codigo: "NO_DISPONIBLE" } });
    dobles.resumen.mockRejectedValueOnce(new ErrorOperacion("NO_DISPONIBLE"));
    expect(await generarReporte(pid)).toMatchObject({ ok: false, error: { codigo: "NO_DISPONIBLE" } });
    dobles.resumen.mockResolvedValueOnce(resumen({ descripcion: "x".repeat(LIMITE_CAPTURA) }));
    const grande = await generarReporte(pid);
    expect(grande).toMatchObject({ ok: false, error: { codigo: "TAMANO_EXCEDIDO" } });
    if (!grande.ok) expect(grande.error.mensaje).toContain("1 MiB");
    dobles.sesion.mockRejectedValueOnce(new ErrorOperacion("SIN_SESION"));
    expect(await generarReporte(pid)).toMatchObject({ ok: false, error: { codigo: "SIN_SESION" } });
  });
});
