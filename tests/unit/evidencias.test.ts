import { describe, expect, test } from "vitest";
import {
  agregarEnlaceSchema,
  contenidoPdfValido,
  enlaceValido,
  enviarEntregaSchema,
  guardarResultadoSchema,
  LIMITE_PDF,
  nombrePdfValido,
  quitarEvidenciaSchema,
} from "@/features/evidences/validation";
import { validar } from "@/features/projects/validation";
import { ErrorOperacion } from "@/lib/resultados";
const id = "00000000-0000-4000-a000-000000000001";
const pdf = (cuerpo: string) => new TextEncoder().encode(cuerpo);
describe("CU-04: entradas de entrega y evidencia", () => {
  test("acepta enlaces http/https absolutos y rechaza otros esquemas, espacios y excesos", () => {
    expect(enlaceValido("https://example.test/informe?v=1#a")).toBe(true);
    expect(enlaceValido("http://localhost:3000/x")).toBe(true);
    for (const malo of [
      "",
      "ftp://example.test",
      "javascript:alert(1)",
      "https://",
      "https:///ruta",
      "https://ej emplo.test",
      "example.test/informe",
      `https://example.test/${"a".repeat(2030)}`,
    ])
      expect(enlaceValido(malo), malo).toBe(false);
    expect(enlaceValido(`https://e.test/${"a".repeat(2048 - 15)}`)).toBe(true);
  });
  test("valida nombre y formato básico de PDF sin confiar en la extensión", () => {
    expect(nombrePdfValido("Informe final.PDF")).toBe(true);
    for (const malo of ["a.txt", "../a.pdf", "c\\a.pdf", "a\n.pdf", "", `${"a".repeat(252)}.pdf`])
      expect(nombrePdfValido(malo), malo).toBe(false);
    expect(contenidoPdfValido(pdf("%PDF-1.7\n...\n%%EOF\n"))).toBe(true);
    expect(contenidoPdfValido(pdf("%PDF-1.7\n...\n%%EOF basura"))).toBe(false);
    expect(contenidoPdfValido(pdf("<html>%%EOF"))).toBe(false);
    expect(contenidoPdfValido(new Uint8Array())).toBe(false);
    const grande = new Uint8Array(LIMITE_PDF + 1);
    grande.set(pdf("%PDF-"));
    grande.set(pdf("%%EOF"), grande.length - 5);
    expect(contenidoPdfValido(grande)).toBe(false);
  });
  test("normaliza resultado vacío a nulo y exige versión e identificadores exactos", () => {
    expect(
      validar(guardarResultadoSchema, { entregaId: id, resultado: "   ", versionEsperada: "3" }).resultado,
    ).toBeNull();
    expect(
      validar(guardarResultadoSchema, { entregaId: id, resultado: " Hecho ", versionEsperada: "3" }).resultado,
    ).toBe("Hecho");
    for (const entrada of [
      { entregaId: id, resultado: "x".repeat(20001), versionEsperada: "1" },
      { entregaId: id, resultado: "x", versionEsperada: "0" },
      { entregaId: "x", resultado: "x", versionEsperada: "1" },
      { entregaId: id, resultado: "x", versionEsperada: "1", extra: true },
    ])
      expect(() => validar(guardarResultadoSchema, entrada)).toThrow(ErrorOperacion);
    expect(() => validar(enviarEntregaSchema, { entregaId: id, versionEsperada: 2 })).toThrow(ErrorOperacion);
    expect(() => validar(quitarEvidenciaSchema, { evidenciaId: id, versionEsperada: "2" })).not.toThrow();
  });
  test("rechaza el enlace inválido indicando el campo", () => {
    try {
      validar(agregarEnlaceSchema, { entregaId: id, url: "ftp://x", versionEsperada: "1" });
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(ErrorOperacion);
      expect((e as ErrorOperacion).campos?.url).toMatch(/http/);
    }
    expect(
      validar(agregarEnlaceSchema, { entregaId: id, url: "  https://a.test/b ", versionEsperada: "1" }).url,
    ).toBe("https://a.test/b");
  });
});
