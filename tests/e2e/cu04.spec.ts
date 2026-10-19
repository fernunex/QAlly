import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { loadEnvFile } from "node:process";
import { clients, checked, rpc, stableId } from "../../scripts/lib/local.mjs";
import { samplePdf } from "../../scripts/lib/fixtures.mjs";
loadEnvFile(".env.local");
const clave = process.env.QALLY_DEV_PASSWORD!;
const base = "http://127.0.0.1:3100";
const miembro = "miembro2@qally.example.test";
const ajeno = "miembro3@qally.example.test";

async function cliente(email: string) {
  const { anon } = clients();
  checked(await anon.auth.signInWithPassword({ email, password: clave }));
  return anon;
}
async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Correo", { exact: true }).fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(clave);
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await expect(page).toHaveURL(/\/proyectos$/);
}
/** Proyecto aislado por ejecución con una actividad asignada al miembro. */
async function fixture(descripcion: string) {
  const qa = await cliente("qa1@qally.example.test");
  const tipo = checked(
    await qa.from("tipo_actividad").select("id").eq("codigo", "A-01").single(),
  );
  const p = await rpc(qa, "crear_proyecto", {
    p_solicitud_id: randomUUID(),
    p_nombre: `CU-04 ${descripcion}`,
    p_descripcion: "Fixture local de entrega de evidencias",
    p_fecha_inicio: "2026-10-01",
    p_miembros_ids: [stableId(miembro)],
  });
  const a = await rpc(qa, "agregar_actividad", {
    p_proyecto_id: p.id,
    p_tipo_id: tipo.id,
    p_descripcion: descripcion,
  });
  await rpc(qa, "asignar_responsable", {
    p_actividad_id: a.id,
    p_responsable_id: stableId(miembro),
    p_version_esperada: a.version,
  });
  return { qa, proyectoId: p.id as string, actividadId: a.id as string };
}
async function abrir(page: Page, descripcion: string) {
  await page.goto("/mis-actividades");
  await page.getByRole("button", { name: new RegExp(descripcion) }).click();
  await expect(
    page.getByRole("heading", { name: descripcion, exact: true }),
  ).toBeVisible();
}
const entregas = async (qa: Awaited<ReturnType<typeof cliente>>, id: string) =>
  checked(
    await qa
      .from("entrega")
      .select("id,numero_intento,resultado,enviada_en,evidencia(id,tipo,url)")
      .eq("actividad_id", id)
      .order("numero_intento"),
  );

test("CU-04: iniciar, validar, adjuntar PDF y enlace, enviar y corregir tras devolución", async ({
  page,
}) => {
  const descripcion = `Entrega E2E ${randomUUID().slice(0, 8)}`;
  const { qa, actividadId } = await fixture(descripcion);
  await login(page, miembro);
  await abrir(page, descripcion);

  // SF-01
  await page
    .getByRole("button", { name: "Iniciar actividad", exact: true })
    .click();
  await expect(page.getByText("Intento 1 · en preparación")).toBeVisible();

  // FE-02
  await page
    .getByRole("button", { name: "Enviar a revisión", exact: true })
    .click();
  await expect(page.getByText("Falta el resultado de la actividad.")).toBeVisible();
  await expect(page.getByText(/Falta la evidencia/)).toBeVisible();

  // FE-03: enlace y archivo inválidos no se agregan.
  await page.getByRole("button", { name: "Agregar enlace", exact: true }).click();
  const enlace = page.getByLabel("Enlace de la evidencia", { exact: true });
  await enlace.fill("ftp://example.test/informe");
  await page.getByRole("button", { name: "Agregar", exact: true }).click();
  await expect(page.getByText(/El enlace no es válido/)).toBeVisible();
  await enlace.fill("https://example.test/informe-e2e");
  await page.getByRole("button", { name: "Agregar", exact: true }).click();
  await expect(page.getByText("https://example.test/informe-e2e")).toBeVisible();
  const archivo = page.getByLabel("Seleccionar archivo PDF", { exact: true });
  await archivo.setInputFiles({
    name: "notas.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("no es pdf"),
  });
  await expect(page.getByText(/no es un PDF válido/)).toBeVisible();
  await archivo.setInputFiles({
    name: "informe-revisión.pdf",
    mimeType: "application/pdf",
    buffer: samplePdf(),
  });
  await expect(page.getByText("informe-revisión.pdf")).toBeVisible();

  await page.getByLabel("Resultado", { exact: true }).fill("Revisión completa, sin hallazgos críticos.");
  await page
    .getByRole("button", { name: "Enviar a revisión", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByText(/Solo lectura · enviada/)).toBeVisible();

  // Persistencia tras recargar.
  await page.reload();
  await abrir(page, descripcion);
  await expect(page.getByRole("dialog").getByText(/Solo lectura · enviada/)).toBeVisible();
  const descarga = page.getByRole("dialog").getByRole("link", { name: "Descargar" });
  await expect(descarga).toBeVisible();
  const [intento1] = await entregas(qa, actividadId);
  expect(intento1.enviada_en).not.toBeNull();
  expect(intento1.evidencia).toHaveLength(2);
  const actividad = checked(
    await qa.from("actividad_sqa").select("estado,version").eq("id", actividadId).single(),
  );
  expect(actividad.estado).toBe("En revisión");

  // Lectura privada como adjunto.
  const pdf = intento1.evidencia.find((e: { tipo: string }) => e.tipo === "PDF")!;
  const r = await page.request.get(`/api/evidencias/${pdf.id}/archivo`);
  expect(r.status()).toBe(200);
  expect(r.headers()["content-type"]).toBe("application/pdf");
  expect(r.headers()["cache-control"]).toContain("no-store");
  expect(r.headers()["x-content-type-options"]).toBe("nosniff");
  expect(r.headers()["content-disposition"]).toMatch(/^attachment;/);
  expect((await r.body()).subarray(0, 5).toString()).toBe("%PDF-");

  // SF-02: QA devuelve y el miembro corrige en un intento nuevo.
  await rpc(qa, "revisar_entrega", {
    p_entrega_id: intento1.id,
    p_decision: "Devolver",
    p_observaciones: "Adjuntar el checklist firmado.",
    p_version_esperada: String(actividad.version),
  });
  await page.goto("/mis-actividades");
  await expect(page.getByRole("listitem").filter({ hasText: descripcion }).getByText(/Devuelta con observaciones/)).toBeVisible();
  await abrir(page, descripcion);
  await expect(page.getByText("Adjuntar el checklist firmado.").first()).toBeVisible();
  await page.getByRole("button", { name: "Corregir entrega", exact: true }).click();
  await expect(page.getByText("Intento 2 · en preparación")).toBeVisible();
  const resultado = page.getByLabel("Resultado", { exact: true });
  await expect(resultado).toHaveValue("Revisión completa, sin hallazgos críticos.");
  await resultado.fill("Revisión completa con checklist firmado.");
  await page
    .getByRole("button", { name: "Enviar a revisión", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByText(/Solo lectura · enviada/)).toBeVisible();
  const intentos = await entregas(qa, actividadId);
  expect(intentos).toHaveLength(2);
  expect(intentos[0].resultado).toBe("Revisión completa, sin hallazgos críticos.");
  expect(intentos[1].resultado).toBe("Revisión completa con checklist firmado.");
  expect(intentos[1].evidencia).toHaveLength(2);
});

test("CU-04: rechaza accesos ajenos, sin origen, sin sesión y proyecto cerrado", async ({
  page,
  browser,
}) => {
  const descripcion = `Seguridad E2E ${randomUUID().slice(0, 8)}`;
  const { qa, proyectoId, actividadId } = await fixture(descripcion);
  const m = await cliente(miembro);
  const a = checked(
    await m.from("actividad_sqa").select("version").eq("id", actividadId).single(),
  );
  const iniciada = await rpc(m, "iniciar_actividad", {
    p_actividad_id: actividadId,
    p_version_esperada: String(a.version),
  });
  const entrega = await rpc(m, "preparar_entrega", {
    p_actividad_id: actividadId,
    p_version_esperada: iniciada.version,
  });

  // Otro miembro sin participación: mismo trato que un recurso inexistente.
  await login(page, ajeno);
  const subida = (origen?: string) =>
    page.request.post(`/api/entregas/${entrega.id}/evidencias/pdf`, {
      headers: {
        "Content-Type": "application/pdf",
        "X-Nombre-Archivo": "x.pdf",
        "X-Version-Actividad": String(entrega.version),
        ...(origen ? { Origin: origen } : {}),
      },
      data: samplePdf(),
    });
  expect((await subida(base)).status()).toBe(404);
  expect((await subida()).status()).toBe(403);
  expect((await subida("https://evil.example")).status()).toBe(403);
  await page.goto("/mis-actividades");
  await expect(page.getByText(descripcion)).toHaveCount(0);

  // Sin sesión.
  const anonimo = await browser.newContext();
  const r = await anonimo.request.post(
    `${base}/api/entregas/${entrega.id}/evidencias/pdf`,
    {
      headers: { "Content-Type": "application/pdf", Origin: base, "X-Nombre-Archivo": "x.pdf", "X-Version-Actividad": "1" },
      data: samplePdf(),
    },
  );
  expect(r.status()).toBe(401);
  await anonimo.close();
  expect(await entregas(qa, actividadId)).toEqual([
    expect.objectContaining({ evidencia: [] }),
  ]);

  // Proyecto cerrado: solo lectura, sin iniciar ni preparar.
  const p = checked(
    await qa.from("proyecto").select("version").eq("id", proyectoId).single(),
  );
  await rpc(qa, "cerrar_proyecto", {
    p_proyecto_id: proyectoId,
    p_version_esperada: String(p.version),
  });
  const propia = await browser.newPage();
  await login(propia, miembro);
  await propia.goto("/mis-actividades");
  await propia.getByRole("button", { name: new RegExp(descripcion) }).click();
  await expect(propia.getByText(/El proyecto está cerrado|solo lectura/i).first()).toBeVisible();
  await expect(propia.getByRole("button", { name: "Enviar a revisión" })).toHaveCount(0);
  await propia.close();
});
