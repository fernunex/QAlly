import { redirect } from "next/navigation";

/**
 * El punto de entrada es el listado de proyectos (CU-01).
 * El «Inicio QA» del mockup no tiene CU y queda fuera hasta que se decida.
 */
export default function Home() {
  redirect("/proyectos");
}
