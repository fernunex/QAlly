import { describe, expect, test } from "vitest";
import {
  crearProyectoSchema,
  datosGeneralesSchema,
  editarProyectoSchema,
  cerrarProyectoSchema,
  paginaSchema,
  validar,
  buscarMiembrosSchema,
  objetivoSchema,
} from "@/features/projects/validation";
import { crearCursor, leerCursor } from "@/features/projects/pagination";
import { comprobarError, errorPublico, ErrorOperacion } from "@/lib/resultados";
const id = "00000000-0000-4000-a000-000000000001";
const general = {
  nombre: "  Proyecto  ",
  descripcion: " Alcance ",
  periodoAcademico: "",
  fechaInicio: "2026-10-01",
  fechaFinPrevista: null,
};
const alta = {
  ...general,
  solicitudId: id,
  miembrosIds: [],
  actividadesTiposIds: [],
  metricas: [],
};
describe("CU-01: entradas y errores públicos", () => {
  test("normaliza los campos y permite selecciones vacías sin inventar mínimos", () => {
    expect(validar(crearProyectoSchema, alta)).toMatchObject({
      nombre: "Proyecto",
      descripcion: "Alcance",
      periodoAcademico: null,
      metricas: [],
    });
  });
  test.each([
    { nombre: " " },
    { descripcion: "x".repeat(5001) },
    { nombre: "x".repeat(201) },
    { periodoAcademico: "x".repeat(41) },
    { fechaInicio: "2026-02-30" },
    { fechaFinPrevista: "2026-09-30" },
  ])("rechaza campos/fechas inválidos: %o", (cambio) => {
    expect(
      datosGeneralesSchema.safeParse({ ...general, ...cambio }).success,
    ).toBe(false);
  });
  test("valida años bisiestos y fechas iguales", () => {
    expect(
      datosGeneralesSchema.safeParse({
        ...general,
        fechaInicio: "2028-02-29",
        fechaFinPrevista: "2028-02-29",
      }).success,
    ).toBe(true);
  });
  test.each([
    { miembrosIds: [id, id] },
    { actividadesTiposIds: [id, id] },
    {
      metricas: [
        { tipoId: id, objetivo: "90" },
        { tipoId: id, objetivo: "90" },
      ],
    },
    { creadoPor: id },
    { rol: "QA" },
    { metricas: [{ tipoId: id, objetivo: "1e2" }] },
    { metricas: [{ tipoId: id, objetivo: "1.23456" }] },
    { solicitudId: "ta-01" },
  ])(
    "rechaza duplicados, suplantación y transportes inválidos: %o",
    (cambio) => {
      expect(
        crearProyectoSchema.safeParse({ ...alta, ...cambio }).success,
      ).toBe(false);
    },
  );
  test("conserva bigint como cadena y exige una versión positiva válida", () => {
    expect(
      editarProyectoSchema.parse({
        ...general,
        proyectoId: id,
        versionEsperada: "9007199254740993",
      }).versionEsperada,
    ).toBe("9007199254740993");
    for (const v of [1, "0", "-1", "1e2", "9223372036854775808"])
      expect(
        cerrarProyectoSchema.safeParse({ proyectoId: id, versionEsperada: v })
          .success,
      ).toBe(false);
  });
  test("cursor conserva microsegundos y rechaza inyección, truncamiento y propiedades extra", () => {
    const fecha = "2026-10-19T12:00:00.123456+00:00";
    expect(leerCursor(crearCursor(fecha, id))).toEqual({ fecha, id });
    for (const value of [
      "%%%",
      "x".repeat(1025),
      crearCursor("a,b", id),
      Buffer.from(JSON.stringify({ fecha, id, rol: "QA" })).toString(
        "base64url",
      ),
    ])
      expect(() => leerCursor(value)).toThrow(ErrorOperacion);
  });
  test("paginación y búsqueda respetan límites y tipos", () => {
    expect(paginaSchema.parse({})).toEqual({ limite: 25 });
    for (const limite of [0, 101, 1.5, "25"])
      expect(paginaSchema.safeParse({ limite }).success).toBe(false);
    expect(
      buscarMiembrosSchema.safeParse({ texto: "x".repeat(121) }).success,
    ).toBe(false);
    expect(buscarMiembrosSchema.safeParse({ cursor: "sin-uuid" }).success).toBe(
      false,
    );
  });
  test("objetivos validan cotas exactas sin lanzar excepciones por texto inválido", () => {
    for (const v of ["0", "100", "99.9999"])
      expect(objetivoSchema("%").safeParse(v).success).toBe(true);
    for (const v of ["NaN", "Infinity", "1e2", "100.0001", "-1", "1.00001"])
      expect(objetivoSchema("%").safeParse(v).success).toBe(false);
    for (const v of ["1.5", "-1", "2000000001", "NaN"])
      expect(objetivoSchema("defectos").safeParse(v).success).toBe(false);
    expect(objetivoSchema("defectos").safeParse("2000000000").success).toBe(
      true,
    );
  });
  test("las excepciones de BD se traducen sin SQL ni detalles privados", () => {
    try {
      comprobarError({ code: "23514", message: "SQL privado" });
    } catch (e) {
      expect(errorPublico(e)).toEqual({
        codigo: "DATOS_INVALIDOS",
        mensaje: "Revisa los campos indicados antes de guardar.",
        campos: undefined,
      });
    }
    try {
      comprobarError({ code: "23505", message: "nombre del constraint" });
    } catch (e) {
      expect(errorPublico(e).codigo).toBe("CONFLICTO");
    }
    try {
      validar(datosGeneralesSchema, { ...general, nombre: "" });
    } catch (e) {
      expect(errorPublico(e).campos?.nombre).toBeTruthy();
    }
  });
});
