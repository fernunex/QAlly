import { describe, expect, test } from "vitest";
import { validar } from "@/features/projects/validation";
import {
  agregarActividadSchema,
  aprobarEntregaSchema,
  asignarResponsableSchema,
  consultarActividadSchema,
  devolverEntregaSchema,
  listarActividadesSchema,
} from "@/features/activities/validation";
import { resumenDevuelto } from "@/features/activities/utils";
import { ErrorOperacion } from "@/lib/resultados";
const id = "00000000-0000-4000-a000-000000000001";
const otro = "00000000-0000-4000-a000-000000000002";

describe("CU-03: entradas de actividades SQA", () => {
  test("agregar normaliza la descripción y exige tipo UUID", () => {
    expect(
      validar(agregarActividadSchema, {
        proyectoId: id,
        tipoId: otro,
        descripcion: "  Revisión del SRS  ",
      }),
    ).toEqual({ proyectoId: id, tipoId: otro, descripcion: "Revisión del SRS" });
  });
  test.each([
    { descripcion: "   " },
    { descripcion: "x".repeat(5001) },
    { tipoId: "ta-01" },
    { proyectoId: "1" },
    { estado: "Aprobada" },
  ])("rechaza alta inválida o con propiedades ajenas: %o", (cambio) => {
    expect(
      agregarActividadSchema.safeParse({
        proyectoId: id,
        tipoId: otro,
        descripcion: "Ok",
        ...cambio,
      }).success,
    ).toBe(false);
  });
  test("asignar exige versión bigint exacta en cadena", () => {
    const base = { actividadId: id, responsableId: otro };
    expect(
      validar(asignarResponsableSchema, {
        ...base,
        versionEsperada: "9223372036854775807",
      }).versionEsperada,
    ).toBe("9223372036854775807");
    for (const v of ["0", "01", "1.0", 1, "9223372036854775808"])
      expect(
        asignarResponsableSchema.safeParse({ ...base, versionEsperada: v })
          .success,
      ).toBe(false);
  });
  test("devolver exige observaciones; aprobar las admite opcionales", () => {
    const base = { entregaId: id, versionEsperada: "3" };
    expect(() =>
      validar(devolverEntregaSchema, { ...base, observaciones: "  " }),
    ).toThrow(ErrorOperacion);
    expect(
      devolverEntregaSchema.safeParse({ ...base, observaciones: "x".repeat(10001) })
        .success,
    ).toBe(false);
    expect(validar(aprobarEntregaSchema, base).observaciones).toBeNull();
    expect(
      validar(aprobarEntregaSchema, { ...base, observaciones: "  " })
        .observaciones,
    ).toBeNull();
    expect(
      validar(aprobarEntregaSchema, { ...base, observaciones: " Bien " })
        .observaciones,
    ).toBe("Bien");
    // La decisión es fija por operación: no se acepta como entrada.
    expect(
      aprobarEntregaSchema.safeParse({ ...base, decision: "Devolver" }).success,
    ).toBe(false);
  });
  test("listar acepta filtros aprobados y rechaza los desconocidos", () => {
    expect(
      validar(listarActividadesSchema, {
        proyectoId: id,
        estado: "En revisión",
        etapa: "diseno",
        responsable: "sin",
      }),
    ).toMatchObject({ limite: 25, soloMias: false, responsable: "sin" });
    for (const cambio of [
      { estado: "Cerrada" },
      { etapa: "requerimientos" },
      { responsable: "todos" },
      { limite: 101 },
      { orden: "nombre" },
    ])
      expect(
        listarActividadesSchema.safeParse({ proyectoId: id, ...cambio }).success,
      ).toBe(false);
  });
  test("consultar pagina intentos con cursor numérico", () => {
    expect(
      validar(consultarActividadSchema, { actividadId: id, cursorIntentos: "4" }),
    ).toMatchObject({ limiteIntentos: 10, cursorIntentos: "4" });
    for (const c of ["0", "-1", "a", "1e3"])
      expect(
        consultarActividadSchema.safeParse({ actividadId: id, cursorIntentos: c })
          .success,
      ).toBe(false);
  });
  test("una fila devuelta es En progreso con última decisión Devolver", () => {
    const envio = {
      numeroIntento: 1,
      enviadaEn: "2026-10-10T00:00:00Z",
      revisadaEn: "2026-10-11T00:00:00Z",
    };
    expect(
      resumenDevuelto({
        estado: "En progreso",
        ultimoEnvio: { ...envio, decision: "Devolver" },
      }),
    ).toBe(true);
    expect(
      resumenDevuelto({
        estado: "Aprobada",
        ultimoEnvio: { ...envio, decision: "Aprobar" },
      }),
    ).toBe(false);
    expect(resumenDevuelto({ estado: "En progreso", ultimoEnvio: null })).toBe(
      false,
    );
  });
});
