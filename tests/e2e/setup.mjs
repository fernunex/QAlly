import { seedDevelopment } from "../../scripts/seed-dev.mjs";
import { clients, checked, rpc, stableId } from "../../scripts/lib/local.mjs";
export default async function setup() {
  const seed = await seedDevelopment();
  const qa = seed.users[0],
    member = seed.users[2];
  for (let i = 0; i < 26; i++)
    await rpc(qa.client, "crear_proyecto", {
      p_solicitud_id: stableId(`e2e:pagina:${i}`),
      p_nombre: `Paginación CU-01 ${i}`,
      p_descripcion: "Fixture local de paginación",
      p_fecha_inicio: "2026-10-01",
      p_miembros_ids: [member.id],
    });
  const p = await rpc(qa.client, "crear_proyecto", {
    p_solicitud_id: stableId("e2e:actividades-paginadas"),
    p_nombre: "Actividades paginadas CU-01",
    p_descripcion: "Fixture de lectura paginada de actividades",
    p_fecha_inicio: "2026-10-01",
    p_miembros_ids: [member.id],
  });
  const actividades = checked(
    await qa.client
      .from("actividad_sqa")
      .select("descripcion")
      .eq("proyecto_id", p.id),
  );
  const descripciones = new Set(actividades.map((a) => a.descripcion));
  for (let i = 0; i < 30; i++)
    if (!descripciones.has(`Actividad de paginación ${i}`))
      await rpc(qa.client, "agregar_actividad", {
        p_proyecto_id: p.id,
        p_tipo_id: seed.tiposA[0].id,
        p_descripcion: `Actividad de paginación ${i}`,
      });
  const { admin } = clients();
  const users = checked(
    await admin.auth.admin.listUsers({ perPage: 1000 }),
  ).users;
  for (let i = 0; i < 26; i++) {
    const id = stableId(`e2e:miembro:${i}`),
      email = `e2e-miembro-${i}@qally.example.test`;
    const existing = users.find((u) => u.email === email);
    if (existing && existing.id !== id)
      throw new Error("Fixture de identidad inesperada");
    if (!existing)
      checked(
        await admin.auth.admin.createUser({
          id,
          email,
          password: process.env.QALLY_DEV_PASSWORD,
          email_confirm: true,
        }),
      );
    checked(
      await admin
        .from("perfil")
        .upsert({
          usuario_id: id,
          nombre: `Persona de prueba ${String(i).padStart(2, "0")}`,
          rol: "Miembro del equipo",
        }),
    );
  }
}
