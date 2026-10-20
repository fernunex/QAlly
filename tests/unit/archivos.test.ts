import { beforeEach, describe, expect, it, vi } from "vitest";

const dobles = vi.hoisted(() => ({
  sesion: vi.fn(), admin: vi.fn(), rpc: vi.fn(), upload: vi.fn(), remove: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/session", () => ({ obtenerSesion: dobles.sesion }));
vi.mock("@/lib/supabase/admin", () => ({ crearClienteAdministrativo: dobles.admin }));
import { leerCuerpoLimitado, subirPdf } from "@/features/evidences/server/archivos";
import { LIMITE_PDF } from "@/features/evidences/validation";

const archivoId = "f951090b-b951-4ceb-98dd-b556b50beb75";
const usuarioId = "f951090b-b951-4ceb-98dd-b556b50beb76";
const ruta = "proyecto/intento/archivo.pdf";
const entrada = {
  entregaId: "f951090b-b951-4ceb-98dd-b556b50beb77", versionEsperada: "5",
  nombre: "informe.pdf", bytes: new TextEncoder().encode("%PDF-1.4\ncontenido\n%%EOF\n"),
};
beforeEach(() => {
  vi.resetAllMocks();
  const consulta = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() };
  consulta.select.mockReturnValue(consulta);
  consulta.eq.mockReturnValue(consulta);
  consulta.maybeSingle.mockResolvedValue({ error: null, data: {
    actividad_id: "actividad", enviada_en: null, autor_id: usuarioId,
    actividad: { responsable_id: usuarioId, estado: "En progreso" },
  } });
  dobles.sesion.mockResolvedValue({ usuario: { id: usuarioId, rol: "Miembro" }, supabase: { from: () => consulta } });
  dobles.admin.mockReturnValue({ rpc: dobles.rpc, storage: { from: () => ({ upload: dobles.upload, remove: dobles.remove }) } });
  dobles.upload.mockResolvedValue({ error: null });
  dobles.remove.mockResolvedValue({ error: null });
  dobles.rpc.mockImplementation(async (nombre: string) => ({ error: null, data:
    nombre === "reservar_archivo" ? { id: archivoId, rutaObjeto: ruta }
    : nombre === "marcar_limpieza" ? [{ id: archivoId, rutaObjeto: ruta }] : {},
  }));
});

describe("Fallos del protocolo de PDF", () => {
  it("un rechazo conocido después de transferir compensa solo el archivo reservado", async () => {
    const original = dobles.rpc.getMockImplementation()!;
    dobles.rpc.mockImplementation((nombre, datos) => nombre === "confirmar_archivo"
      ? Promise.resolve({ data: null, error: { code: "P0001", message: "CONFLICTO" } }) : original(nombre, datos));
    await expect(subirPdf(entrada)).rejects.toMatchObject({ codigo: "CONFLICTO" });
    expect(dobles.upload).toHaveBeenCalledOnce();
    expect(dobles.rpc).toHaveBeenCalledWith("marcar_limpieza", { p_limite: 1, p_archivo_compensacion_id: archivoId });
    expect(dobles.remove).toHaveBeenCalledWith([ruta]);
    expect(dobles.rpc).toHaveBeenCalledWith("confirmar_eliminacion", { p_archivo_id: archivoId });
  });
  it("confirmación ambigua conserva el objeto y no ejecuta limpieza inmediata", async () => {
    const original = dobles.rpc.getMockImplementation()!;
    dobles.rpc.mockImplementation((nombre, datos) => nombre === "confirmar_archivo"
      ? Promise.resolve({ data: null, error: { message: "conexión interrumpida" } }) : original(nombre, datos));
    await expect(subirPdf(entrada)).rejects.toThrow("FALLO_PERSISTENCIA");
    expect(dobles.remove).not.toHaveBeenCalled();
    expect(dobles.rpc.mock.calls.map(([n]) => n)).toEqual(["reservar_archivo", "confirmar_archivo"]);
  });
  it("fallo ambiguo de Storage deja la reserva para limpieza y no confirma evidencia", async () => {
    dobles.upload.mockResolvedValue({ error: { message: "sin respuesta" } });
    await expect(subirPdf(entrada)).rejects.toMatchObject({ codigo: "FALLO_PERSISTENCIA" });
    expect(dobles.rpc.mock.calls.map(([n]) => n)).toEqual(["reservar_archivo"]);
    expect(dobles.remove).not.toHaveBeenCalled();
  });
  it("si Storage no permite borrar, no confirma una eliminación que no ocurrió", async () => {
    dobles.upload.mockResolvedValue({ error: { statusCode: "413" } });
    dobles.remove.mockResolvedValue({ error: { message: "servicio temporalmente indisponible" } });
    await expect(subirPdf(entrada)).rejects.toMatchObject({ codigo: "TAMANO_EXCEDIDO" });
    expect(dobles.rpc.mock.calls.map(([n]) => n)).not.toContain("confirmar_eliminacion");
  });
  it("sin autorización no obtiene un cliente privilegiado ni reserva un archivo", async () => {
    dobles.sesion.mockResolvedValue({ usuario: { rol: "QA" } });
    await expect(subirPdf(entrada)).rejects.toMatchObject({ codigo: "PROHIBIDO" });
    expect(dobles.admin).not.toHaveBeenCalled();
  });
  it("corta una transferencia que excede 3 MiB aunque no declare Content-Length", async () => {
    const cancelar = vi.fn();
    const cuerpo = new ReadableStream<Uint8Array>({
      start(c) { c.enqueue(new Uint8Array(LIMITE_PDF)); c.enqueue(new Uint8Array(1)); },
      cancel: cancelar,
    });
    await expect(leerCuerpoLimitado(cuerpo)).rejects.toMatchObject({ codigo: "TAMANO_EXCEDIDO" });
    expect(cancelar).toHaveBeenCalledOnce();
  });
});
