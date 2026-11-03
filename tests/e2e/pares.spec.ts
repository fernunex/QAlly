/*
 * Revisión entre pares sobre DEC-25–29: cada caso lo diseña y ejecuta un integrante distinto
 * del responsable del CU, buscando bordes y permisos que la revisión personal pudo omitir.
 * Ejecutar con `npm run e2e:pares`. Rotación: docs/equipo/plan-pruebas-dec25-28.md.
 */
import { test, expect } from "@playwright/test";
import { checked, rpc } from "../../scripts/lib/local.mjs";
import {
  actividad,
  contexto,
  detalle,
  EQUIPO,
  ETAPAS,
  login,
  medir,
  preparar,
  proyecto,
  saludEnDashboard,
  type Contexto,
} from "./apoyo";

let c: Contexto;
test.beforeAll(async () => {
  c = await preparar();
});

test(
  "PR-01 desmarcar las diez actividades y métricas crea un proyecto Sin evaluar, no 0 %",
  detalle("@pares", "CU-01", EQUIPO.daniela),
  async ({ page }) => {
    await login(page);
    await page.goto("/proyectos/nuevo");
    await page.getByLabel("Nombre del proyecto", { exact: true }).fill(`PR-01 ${Date.now()}`);
    await page.getByLabel("Descripción", { exact: true }).fill("Sin elementos");
    await page.getByLabel("Fecha de inicio", { exact: true }).fill("2026-10-01");
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    const marcadas = page.getByRole("checkbox", { checked: true });
    await expect(marcadas).toHaveCount(10);
    while ((await marcadas.count()) > 0) await marcadas.first().uncheck();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    for (const codigo of ["M-01", "M-02", "M-03", "M-04"]) await page.getByRole("checkbox", { name: new RegExp(codigo) }).uncheck();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page.getByRole("button", { name: "Registrar proyecto", exact: true }).click();
    await expect(page).toHaveURL(/\/proyectos\/[0-9a-f-]{36}$/);
    await expect(page.getByText("Salud general: Sin evaluar")).toBeVisible();
    await page.goto(`${page.url()}/salud`);
    expect(await saludEnDashboard(page, "Salud general")).toBe("Sin evaluar");
    for (const e of ETAPAS) expect(await saludEnDashboard(page, e)).toBe("Sin evaluar");
  },
);

test(
  "PR-02 objetivo 0 % rechazado en la UI; M-04 con 0 sí; medición sin fuente se guarda sin referencia",
  detalle("@pares", "CU-02", EQUIPO.joss),
  async ({ page }) => {
    const { id: pid } = await proyecto(c, {}, "PR-02");
    await login(page);
    await page.goto(`/proyectos/${pid}/metricas`);
    const dialogo = page.getByRole("dialog", { name: "Agregar métrica" });
    await page.getByRole("button", { name: "Agregar métrica" }).click();
    await dialogo.getByLabel("Tipo de métrica").click();
    await page.getByRole("option", { name: /^M-03/ }).click();
    await dialogo.getByLabel("Objetivo", { exact: true }).fill("0");
    await dialogo.getByRole("button", { name: "Agregar métrica" }).click();
    await expect(dialogo).toContainText("El objetivo debe ser mayor que 0.");
    await dialogo.getByLabel("Objetivo", { exact: true }).fill("0.5");
    await dialogo.getByRole("button", { name: "Agregar métrica" }).click();
    await expect(dialogo).toBeHidden();

    await page.getByRole("button", { name: "Agregar métrica" }).click();
    await dialogo.getByLabel("Tipo de métrica").click();
    await page.getByRole("option", { name: /^M-04/ }).click();
    await dialogo.getByLabel("Objetivo", { exact: true }).fill("0");
    await dialogo.getByRole("button", { name: "Agregar métrica" }).click();
    await expect(dialogo).toBeHidden();

    const fila = page.locator("table tbody tr").filter({ hasText: "M-04" });
    await fila.getByRole("button", { name: "Registrar medición" }).click();
    const medicion = page.getByRole("dialog", { name: "Registrar medición" });
    await medicion.getByLabel("Críticos abiertos", { exact: true }).fill("0");
    await medicion.getByLabel("Altos abiertos", { exact: true }).fill("0");
    await medicion.getByLabel("Fecha de medición").fill("2026-10-10");
    await expect(medicion.getByLabel(/^Fuente/)).toHaveValue("");
    await medicion.getByRole("button", { name: "Guardar medición" }).click();
    await expect(medicion).toBeHidden();
    const revs = checked(
      await c.qa.client
        .from("revision_medicion")
        .select("datos_fuente,medicion!inner(metrica_proyecto!inner(proyecto_id))")
        .eq("medicion.metrica_proyecto.proyecto_id", pid),
    ) as { datos_fuente: Record<string, unknown> }[];
    expect(revs).toHaveLength(1);
    expect(revs[0]!.datos_fuente).not.toHaveProperty("fuente_referencia");
  },
);

test(
  "PR-03 instancias repetidas pesan 1 cada una; En revisión no cuenta como realizada",
  detalle("@pares", "CU-03", EQUIPO.jdsc),
  async ({ page }) => {
    const { id: pid } = await proyecto(c, {}, "PR-03");
    await actividad(c, pid, "A-06", "Aprobada");
    await actividad(c, pid, "A-06", "En revisión");
    await actividad(c, pid, "A-06", "En progreso");
    await login(page);
    await page.goto(`/proyectos/${pid}/salud`);
    expect(await saludEnDashboard(page, "Desarrollo")).toBe("33.33 % · Malo");
    const des = page.getByRole("region", { name: "Desarrollo", exact: true });
    await des.getByText("Ver actividades (3)").click();
    await expect(des.getByText("instancia 2")).toBeVisible();
    await expect(des.getByText("instancia 3")).toBeVisible();
  },
);

test(
  "PR-04 el reporte cita la evidencia del último intento enviado tras una devolución",
  detalle("@pares", "CU-04", EQUIPO.fernando),
  async ({ page }) => {
    const { id: pid } = await proyecto(c, {}, "PR-04");
    // Primer intento devuelto con observaciones; el segundo se envía con otra URL.
    let a = await rpc(c.qa.client, "agregar_actividad", { p_proyecto_id: pid, p_tipo_id: c.tipoA("A-09"), p_descripcion: "Pruebas" });
    a = await rpc(c.qa.client, "asignar_responsable", { p_actividad_id: a.id, p_responsable_id: c.m1.id, p_version_esperada: a.version });
    a = await rpc(c.m1.client, "iniciar_actividad", { p_actividad_id: a.id, p_version_esperada: a.version });
    for (const [url, decision] of [["https://example.test/intento-1", "Devolver"], ["https://example.test/intento-2", null]] as const) {
      const e = await rpc(c.m1.client, "preparar_entrega", { p_actividad_id: a.id, p_version_esperada: a.version });
      a = await rpc(c.m1.client, "guardar_resultado", { p_entrega_id: e.id, p_resultado: "Resultado", p_version_esperada: e.version });
      if (url.endsWith("2")) {
        // El intento 2 copia la evidencia del 1; se quita para dejar solo la nueva.
        const [vieja] = checked(await c.m1.client.from("evidencia").select("id").eq("entrega_id", e.id)) as { id: string }[];
        a = await rpc(c.m1.client, "quitar_evidencia", { p_evidencia_id: vieja!.id, p_version_esperada: a.version });
      }
      a = await rpc(c.m1.client, "agregar_enlace", { p_entrega_id: e.id, p_url: url, p_version_esperada: a.version });
      a = await rpc(c.m1.client, "enviar_entrega", { p_entrega_id: e.id, p_version_esperada: a.version });
      if (decision)
        a = await rpc(c.qa.client, "revisar_entrega", { p_entrega_id: e.id, p_decision: decision, p_observaciones: "Falta el reporte", p_version_esperada: a.version });
    }
    await login(page);
    await page.goto(`/proyectos/${pid}/reportes`);
    await page.getByRole("button", { name: "Generar reporte" }).click();
    const fila = page.getByRole("article", { name: "Reporte de calidad" }).getByRole("row").filter({ hasText: "A-09" });
    await expect(fila).toContainText("En revisión");
    await expect(fila.getByRole("link", { name: "https://example.test/intento-2" })).toBeVisible();
    await expect(fila).not.toContainText("intento-1");
  },
);

test(
  "PR-05 Excelente con defectos graves advierte sin tope; 89.999 % se muestra 90.00 % pero es Bueno",
  detalle("@pares", "CU-05", EQUIPO.fernando),
  async ({ page }) => {
    const { id: defectos } = await proyecto(c, { "M-04": "0" }, "PR-05 defectos");
    for (let i = 0; i < 19; i++) await actividad(c, defectos, "A-09", "Aprobada");
    await medir(c, defectos, "M-04", { criticos_abiertos: 1, altos_abiertos: 2 });
    const { id: borde } = await proyecto(c, { "M-02": "100" }, "PR-05 borde");
    await medir(c, borde, "M-02", { integrados_revisados: 89999, integrados: 100000 });

    await login(page);
    await page.goto(`/proyectos/${defectos}/salud`);
    expect(await saludEnDashboard(page, "Salud general")).toBe("95.00 % · Excelente");
    await expect(page.getByRole("region", { name: "Salud general" })).toContainText("Defectos graves abiertos");
    await page.goto(`/proyectos/${borde}/salud`);
    expect(await saludEnDashboard(page, "Salud general")).toBe("90.00 % · Bueno");
  },
);

test(
  "PR-06 solo QA participante genera el reporte; proyecto cerrado conserva la salud en vista y dashboard",
  detalle("@pares", "CU-06", EQUIPO.joss),
  async ({ page, browser }) => {
    const { id: pid } = await proyecto(c, { "M-02": "100" }, "PR-06");
    await actividad(c, pid, "A-01", "Aprobada");
    await medir(c, pid, "M-02", { integrados_revisados: 1, integrados: 2 });
    const { version } = checked(await c.qa.client.from("proyecto").select("version:version::text").eq("id", pid).single()) as { version: string };
    await rpc(c.qa.client, "cerrar_proyecto", { p_proyecto_id: pid, p_version_esperada: version });

    const miembro = await contexto(browser, "miembro1@qally.example.test");
    await miembro.page.goto(`/proyectos/${pid}/reportes`);
    await expect(miembro.page.getByRole("button", { name: "Generar reporte" })).toHaveCount(0);
    await miembro.ctx.close();

    await login(page);
    await page.goto(`/proyectos/${pid}/salud`);
    // (1 + 0.5) / 2 = 75 %.
    expect(await saludEnDashboard(page, "Salud general")).toBe("75.00 % · Bueno");
    await page.goto(`/proyectos/${pid}/reportes`);
    await page.getByRole("button", { name: "Generar reporte" }).click();
    const fila = page.getByRole("article", { name: "Reporte de calidad" }).getByRole("table").first().getByRole("row").filter({ hasText: "General" });
    await expect(fila).toContainText("75.00 % · Bueno");
  },
);
