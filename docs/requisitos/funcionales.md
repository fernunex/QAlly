## 6. Requerimientos funcionales (RF)

| **ID** | **CU**      | **Requerimiento funcional**                                                                                        |
|--------|-------------|--------------------------------------------------------------------------------------------------------------------|
| RF-01  | CU-01       | Registrar un proyecto con información general y miembros asociados.                                                |
| RF-02  | CU-01       | Permitir seleccionar las actividades SQA iniciales del catálogo y modificar la preselección.                       |
| RF-03  | CU-01       | Permitir seleccionar las métricas iniciales y configurar sus objetivos o umbrales.                                 |
| RF-04  | CU-01       | Crear las actividades iniciales como Pendiente y asociar actividades/métricas a sus etapas predefinidas.           |
| RF-05  | CU-01       | Permitir consultar proyectos e información general a usuarios autorizados.                                         |
| RF-06  | CU-01       | Permitir a QA modificar información general de un proyecto.                                                        |
| RF-07  | CU-01       | Permitir a QA cerrar un proyecto conservando sus datos para consulta.                                              |
| RF-08  | CU-02       | Mostrar las métricas configuradas de un proyecto.                                                                  |
| RF-09  | CU-02       | Permitir a QA agregar métricas del catálogo a un proyecto sin duplicar una misma métrica.                          |
| RF-10  | CU-02       | Permitir configurar y actualizar los objetivos o umbrales de una métrica del proyecto.                             |
| RF-11  | CU-02       | Registrar nuevas mediciones y calcular su valor cuando corresponda.                                                |
| RF-12  | CU-02       | Mostrar el valor actual y las mediciones anteriores de cada métrica.                                               |
| RF-13  | CU-02       | Permitir corregir mediciones conservando trazabilidad de la corrección.                                            |
| RF-14  | CU-02       | Indicar cumplimiento o incumplimiento de las métricas evaluables frente a sus objetivos o umbrales.                |
| RF-15  | CU-03       | Consultar las actividades SQA del proyecto y su responsable, estado, resultado y evidencias.                       |
| RF-16  | CU-03       | Permitir a QA agregar instancias de actividades del catálogo con descripción específica.                           |
| RF-17  | CU-03       | Permitir a QA asignar un miembro del proyecto como responsable de una actividad.                                   |
| RF-18  | CU-03       | Permitir a QA aprobar actividades En revisión y registrar la aprobación.                                           |
| RF-19  | CU-03       | Permitir a QA devolver actividades En revisión con observaciones registradas.                                      |
| RF-20  | CU-04       | Permitir a cada miembro consultar sus actividades SQA asignadas.                                                   |
| RF-21  | CU-04       | Permitir al miembro responsable iniciar una actividad Pendiente y cambiarla a En progreso.                         |
| RF-22  | CU-04       | Permitir al miembro responsable registrar el resultado de una actividad SQA.                                       |
| RF-23  | CU-04       | Permitir adjuntar evidencia en archivo PDF o mediante enlace.                                                      |
| RF-24  | CU-04       | Permitir enviar una actividad a revisión de QA, exigiendo resultado y evidencia.                                   |
| RF-25  | CU-04       | Permitir corregir y reenviar actividades devueltas por QA.                                                         |
| RF-26  | CU-05       | Determinar la salud general y por etapa con base en métricas y actividades SQA, conforme al algoritmo por definir. |
| RF-27  | CU-05       | Presentar el estado de salud general y por las tres etapas del proyecto cuando pueda calcularse.                   |
| RF-28  | CU-05       | Permitir consultar indicadores, métricas y estados de las actividades SQA por proyecto y etapa.                    |
| RF-29  | CU-05       | Identificar métricas sin medición e información insuficiente para evaluar salud.                                   |
| RF-30  | CU-06       | Generar un reporte sobre la información actual de calidad del proyecto.                                            |
| RF-31  | CU-06       | Visualizar el reporte generado dentro de QAlly.                                                                    |
| RF-32  | CU-06       | Exportar el reporte generado a PDF.                                                                                |
| RF-33  | Transversal | Restringir consultas y operaciones de acuerdo con rol y acceso autorizado al proyecto.                             |

Nota de alcance: RF-26 requiere definir el algoritmo y las clasificaciones de salud; RF-27 podrá desplegar indicadores disponibles y el estado «Sin evaluar» hasta que haya datos y modelo suficiente. Los RF no incorporan gestión interna de defectos: la métrica M-04 se captura desde datos externos.

**Estado:** línea base v0.1 para traslado al SRS. RF-26/27 mantienen el cálculo de salud como decisión pendiente, no funcionalidad descartada.
