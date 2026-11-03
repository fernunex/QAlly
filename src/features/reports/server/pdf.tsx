import "server-only";
import { Document, Font, Link, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { ConteoFila, ModeloReporte } from "../lib/modelo";

/*
 * PDF del reporte (CU-06 SF-01) con `@react-pdf/renderer` en Node.js. Usa solo la fuente
 * estándar Helvetica incluida en el motor: no descarga fuentes, imágenes ni enlaces externos.
 * Recibe el mismo modelo que la vista web, construido desde la captura verificada, y usa su
 * fecha de emisión.
 */

// Sin guiones de corte automáticos (p. ej. «requerim-ientos»): solo se divide entre palabras.
Font.registerHyphenationCallback((palabra) => [palabra]);

/** 3 MiB (contratos v1 §6). Si se supera, error explícito sin recortar contenido. */
export const LIMITE_PDF_REPORTE = 3 * 1024 * 1024;

/** La fuente estándar usa WinAnsi: ≥, ≤, × y Σ no existen y se escriben en ASCII. */
export function textoPdf(texto: string): string {
  return texto.replaceAll("≥", ">=").replaceAll("≤", "<=").replaceAll("×", "x");
}

/** Estilo de una celda; derivado de StyleSheet para no depender de paquetes transitivos. */
type Style = Parameters<typeof StyleSheet.create>[0][string];

const gris = "#57534e";
const borde = "#d6d3d1";
const fondo = "#f5f5f4";

const s = StyleSheet.create({
  pagina: {
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1c1917",
    lineHeight: 1.35,
  },
  sobretitulo: { fontSize: 8, letterSpacing: 1.5, color: gris, fontFamily: "Helvetica-Bold" },
  titulo: { fontSize: 20, lineHeight: 1.2, fontFamily: "Helvetica-Bold", marginTop: 4 },
  texto: { color: gris },
  encabezado: { borderBottomWidth: 1, borderBottomColor: borde, paddingBottom: 12, marginBottom: 6 },
  meta: { flexDirection: "row", marginTop: 2 },
  metaClave: { width: 110, color: gris },
  metaValor: { flex: 1, fontFamily: "Helvetica-Bold" },
  seccion: { marginTop: 16 },
  h2: { fontSize: 13, lineHeight: 1.3, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  h3: { fontSize: 10, fontFamily: "Helvetica-Bold", marginTop: 10, marginBottom: 4 },
  // Bordes por fila: un contenedor con borde que se divide entre páginas falla al renderizar.
  tabla: {},
  fila: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: borde,
  },
  cabecera: {
    backgroundColor: fondo,
    fontFamily: "Helvetica-Bold",
    color: gris,
    fontSize: 8,
    borderTopWidth: 1,
  },
  celda: { paddingVertical: 4, paddingHorizontal: 5 },
  derecha: { textAlign: "right" },
  mono: { fontFamily: "Courier", color: gris },
  enlace: { color: "#1d4ed8", textDecoration: "underline" },
  nota: { marginTop: 8, padding: 6, backgroundColor: fondo, color: gris },
  pie: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: gris,
    borderTopWidth: 1,
    borderTopColor: borde,
    paddingTop: 6,
  },
  // Numeración dinámica anclada con `top` (A4 = 841.89 pt) y lineHeight propio: anclada con
  // `bottom`, @react-pdf 4.9 desborda su alto al re-maquetar documentos de muchas páginas.
  paginacion: {
    position: "absolute",
    top: 806,
    left: 40,
    right: 40,
    fontSize: 7.5,
    lineHeight: 1.2,
    textAlign: "right",
    color: gris,
  },
});

function Celda({ ancho, children, estilo }: { ancho: string | number; children: React.ReactNode; estilo?: Style }) {
  return <Text style={[s.celda, { width: ancho }, estilo ?? {}]}>{children}</Text>;
}

function Conteos({ conteos, total }: { conteos: ConteoFila[]; total: number }) {
  return (
    <View style={s.tabla}>
      <View style={[s.fila, s.cabecera]} wrap={false}>
        {conteos.map((c) => (
          <Celda key={c.estado} ancho="20%">
            {c.estado}
          </Celda>
        ))}
        <Celda ancho="20%">Total</Celda>
      </View>
      <View style={s.fila} wrap={false}>
        {conteos.map((c) => (
          <Celda key={c.estado} ancho="20%">
            {String(c.cantidad)}
          </Celda>
        ))}
        <Celda ancho="20%">{String(total)}</Celda>
      </View>
    </View>
  );
}

export function ReportePdf({ modelo }: { modelo: ModeloReporte }) {
  const { proyecto } = modelo;
  return (
    <Document
      title={`Reporte de calidad · ${proyecto.nombre}`}
      subject="Reporte de calidad"
      creator="QAlly"
      producer="QAlly"
      language="es"
    >
      <Page size="A4" style={s.pagina}>
        <View style={s.encabezado}>
          <Text style={s.sobretitulo}>REPORTE DE CALIDAD</Text>
          <Text style={s.titulo}>{proyecto.nombre}</Text>
          {proyecto.descripcion ? <Text style={[s.texto, { marginTop: 4 }]}>{proyecto.descripcion}</Text> : null}
          <View style={{ marginTop: 8 }}>
            <View style={s.meta}>
              <Text style={s.metaClave}>Fecha de generación</Text>
              <Text style={s.metaValor}>{modelo.fechaGeneracion}</Text>
            </View>
            {proyecto.periodoAcademico ? (
              <View style={s.meta}>
                <Text style={s.metaClave}>Periodo académico</Text>
                <Text style={s.metaValor}>{proyecto.periodoAcademico}</Text>
              </View>
            ) : null}
            <View style={s.meta}>
              <Text style={s.metaClave}>Fechas del proyecto</Text>
              <Text style={s.metaValor}>{proyecto.fechas}</Text>
            </View>
            <View style={s.meta}>
              <Text style={s.metaClave}>Estado del proyecto</Text>
              <Text style={s.metaValor}>{proyecto.estado}</Text>
            </View>
          </View>
        </View>

        <View style={s.seccion} wrap={false}>
          <Text style={s.h2}>1. Salud general y por etapa</Text>
          <View style={s.tabla}>
            <View style={[s.fila, s.cabecera]}>
              <Celda ancho="26%">Ámbito</Celda>
              <Celda ancho="14%">Salud</Celda>
              <Celda ancho="14%">Clasificación</Celda>
              <Celda ancho="16%">Puntos</Celda>
              <Celda ancho="30%">Advertencias</Celda>
            </View>
            {[{ nombre: "General", salud: modelo.salud.general }, ...modelo.etapas].map((f) => (
              <View key={f.nombre} style={s.fila}>
                <Celda ancho="26%" estilo={f.nombre === "General" ? { fontFamily: "Helvetica-Bold" } : undefined}>
                  {f.nombre}
                </Celda>
                <Celda ancho="14%" estilo={{ fontFamily: "Helvetica-Bold" }}>
                  {f.salud.porcentaje}
                </Celda>
                <Celda ancho="14%">{f.salud.clasificacion ?? "-"}</Celda>
                <Celda ancho="16%">{f.salud.puntos}</Celda>
                <Celda ancho="30%" estilo={s.texto}>
                  {f.salud.advertencias.length === 0 ? "-" : f.salud.advertencias.join(" ")}
                </Celda>
              </View>
            ))}
          </View>
          <Text style={s.nota}>{textoPdf(modelo.salud.nota)}</Text>
        </View>

        <View style={s.seccion}>
          <Text style={s.h2}>2. Advertencias</Text>
          {modelo.advertencias.length === 0 ? (
            <Text style={s.texto}>Sin advertencias para el estado actual.</Text>
          ) : (
            modelo.advertencias.map((t) => (
              <Text key={t} style={{ marginBottom: 2 }}>
                {`- ${t}`}
              </Text>
            ))
          )}
        </View>

        <View style={s.seccion}>
          <Text style={s.h2}>3. Métricas</Text>
          {modelo.metricas.length === 0 ? (
            <Text style={s.texto}>El proyecto no tiene métricas configuradas.</Text>
          ) : (
            <View style={s.tabla}>
              <View style={[s.fila, s.cabecera]} wrap={false}>
                <Celda ancho="22%">Métrica</Celda>
                <Celda ancho="13%">Último valor</Celda>
                <Celda ancho="16%">Objetivo</Celda>
                <Celda ancho="15%">Cumplimiento</Celda>
                <Celda ancho="10%">Aporte</Celda>
                <Celda ancho="14%">Estado de medición</Celda>
                <Celda ancho="10%">Medición</Celda>
              </View>
              {modelo.metricas.map((m) => (
                <View key={m.id} style={s.fila} wrap={false}>
                  <View style={[s.celda, { width: "22%" }]}>
                    <Text>
                      <Text style={s.mono}>{m.codigo}</Text> {m.nombre}
                    </Text>
                    <Text style={s.texto}>{m.etapa}</Text>
                  </View>
                  <View style={[s.celda, { width: "13%" }]}>
                    <Text>{m.ultimoValor}</Text>
                    {m.valorCritico ? <Text style={s.texto}>{m.valorCritico}</Text> : null}
                  </View>
                  <Celda ancho="16%">{textoPdf(m.objetivo)}</Celda>
                  <View style={[s.celda, { width: "15%" }]}>
                    <Text>{m.cumplimientoTexto}</Text>
                    {m.criterioCritico ? <Text style={s.texto}>{m.criterioCritico}</Text> : null}
                  </View>
                  <Celda ancho="10%">{m.aporte}</Celda>
                  <Celda ancho="14%">{m.estadoMedicion}</Celda>
                  <Celda ancho="10%">{m.fechaMedicion}</Celda>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={s.seccion}>
          <Text style={s.h2}>4. Actividades SQA</Text>
          <Conteos conteos={modelo.actividades.conteos} total={modelo.actividades.total} />
          <Text style={[s.texto, { marginTop: 4 }]}>
            {`${modelo.actividades.total} actividades SQA en total, distribuidas en las tres etapas del proyecto. Las evidencias son las del último intento enviado; los PDF no se incrustan y requieren sesión en QAlly.`}
          </Text>
          {modelo.etapas.map((etapa) => (
            <View key={etapa.codigo}>
              <Text style={s.h3} minPresenceAhead={40}>
                {`${etapa.nombre} (${etapa.total})`}
              </Text>
              {etapa.actividades.length === 0 ? (
                <Text style={s.texto}>Sin actividades SQA en esta etapa.</Text>
              ) : (
                <View style={s.tabla}>
                  <View style={[s.fila, s.cabecera]} wrap={false} minPresenceAhead={30}>
                    <Celda ancho="36%">Actividad</Celda>
                    <Celda ancho="18%">Responsable</Celda>
                    <Celda ancho="13%">Estado</Celda>
                    <Celda ancho="33%">Evidencias</Celda>
                  </View>
                  {etapa.actividades.map((a) => (
                    <View key={a.id} style={s.fila} wrap={false}>
                      <View style={[s.celda, { width: "36%" }]}>
                        <Text>
                          <Text style={s.mono}>{a.codigo}</Text> {a.nombre}
                        </Text>
                        <Text style={s.texto}>{`Instancia ${a.instancia}`}</Text>
                      </View>
                      <Celda ancho="18%">{a.responsable}</Celda>
                      <Celda ancho="13%">{a.estado}</Celda>
                      <View style={[s.celda, { width: "33%" }]}>
                        {a.evidencias.length === 0 ? (
                          <Text style={s.texto}>Sin evidencias enviadas</Text>
                        ) : (
                          a.evidencias.map((e) => (
                            <Link key={e.id} src={e.href} style={s.enlace}>
                              {e.texto}
                            </Link>
                          ))
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={s.pie} fixed>
          <Text>{`Generado con QAlly · ${modelo.fechaGeneracion}`}</Text>
        </View>
        <Text
          style={s.paginacion}
          fixed
          render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
        />
      </Page>
    </Document>
  );
}

/** Renderiza el PDF en memoria; quien lo llama comprueba el límite de 3 MiB. */
export async function renderizarReportePdf(modelo: ModeloReporte): Promise<Buffer> {
  return renderToBuffer(<ReportePdf modelo={modelo} />);
}
