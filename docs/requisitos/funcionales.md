## 6. Requerimientos funcionales (RF)

| **ID** | **CU**      | **Requerimiento funcional**                                                                                        |
|--------|-------------|--------------------------------------------------------------------------------------------------------------------|
| RF-01  | CU-01       | Registrar un proyecto con información general y miembros asociados.                                                |
| RF-02 | CU-01 | Permitir a QA seleccionar las actividades SQA iniciales con A-01…A-10 preseleccionadas y desmarcables; solo crear las elegidas. |
| RF-03  | CU-01       | Permitir seleccionar las métricas iniciales y configurar sus objetivos o umbrales.                                 |
| RF-04  | CU-01       | Crear las actividades iniciales como Pendiente y asociar actividades/métricas a sus etapas predefinidas.           |
| RF-05  | CU-01       | Permitir consultar proyectos e información general a usuarios autorizados.                                         |
| RF-06  | CU-01       | Permitir a QA modificar información general de un proyecto.                                                        |
| RF-07  | CU-01       | Permitir a QA cerrar un proyecto conservando sus datos para consulta.                                              |
| RF-08  | CU-02       | Mostrar las métricas configuradas de un proyecto.                                                                  |
| RF-09  | CU-02       | Permitir a QA agregar métricas del catálogo a un proyecto sin duplicar una misma métrica.                          |
| RF-10  | CU-02       | Permitir configurar y actualizar los objetivos o umbrales de una métrica del proyecto.                             |
| RF-11 | CU-02 | Registrar mediciones con fecha y datos suficientes para calcular su valor; la referencia o enlace a la fuente es opcional. |
| RF-12  | CU-02       | Mostrar el valor actual y las mediciones anteriores de cada métrica.                                               |
| RF-13  | CU-02       | Permitir corregir mediciones conservando trazabilidad de la corrección.                                            |
| RF-14 | CU-02 | Indicar cumplimiento de métricas evaluables respecto de sus objetivos; M-01 usa el valor general y conserva el criterio de pruebas críticas independiente. |
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
| RF-26 | CU-05 | Calcular salud general y por etapa como 100 × (A + SUM(C_i)) / (N_A + N_M), con aportes y casos límite de las reglas de salud aprobadas. |
| RF-27 | CU-05 | Presentar porcentaje y clasificación Malo [0,50), Regular [50,70), Bueno [70,90), Excelente [90,100] según valor sin redondear; sin elementos, Sin evaluar. |
| RF-28  | CU-05       | Permitir consultar indicadores, métricas y estados de las actividades SQA por proyecto y etapa.                    |
| RF-29 | CU-05 | Identificar Sin medición y No evaluable; sus métricas aportan 0 y permanecen en el denominador con evaluación parcial; advertir falta de datos y defectos graves abiertos sin limitar salud. |
| RF-30 | CU-06 | Generar para QA autorizado el reporte actual con identificación, emisión en hora CDMX, salud general y de tres etapas, actividades/evidencias, métricas y advertencias. |
| RF-31 | CU-06 | Visualizar el reporte dentro de QAlly con los mismos resultados de salud de CU-05 y referencias o enlaces autorizados a evidencias. |
| RF-32 | CU-06 | Exportar a PDF el mismo contenido y captura del reporte visualizado, sin incrustar PDF de evidencia ni crear histórico de PDFs de reporte. |
| RF-33  | Transversal | Restringir consultas y operaciones de acuerdo con rol y acceso autorizado al proyecto.                             |

**Estado: requisitos APROBADOS**, actualizados por [DEC-25–28, 2026-10-30](../decisiones/registro.md#cierre-funcional--2026-10-30). Se conservan los 33 identificadores y sus asociaciones CU. Los diez RNF y sus umbrales no cambian.

RF-26/27/29 se concretan en las [reglas de salud](../producto/reglas-globales.md#salud-aprobada), que definen A, N_A, N_M, aportes porcentuales y M-04, pesos iguales, ausencias y cálculo por etapa/general. RF-30/31/32 se concretan en el [contenido del reporte](../producto/reglas-globales.md#contenido-del-reporte). No se incorpora gestión interna de defectos.

**Diferencia respecto a la implementación actual:** aprobación funcional no significa comportamiento implementado o probado. [Pendientes y brechas](pendientes-y-brechas.md) registra incompatibilidades verificadas, incluido el objetivo porcentual cero todavía sin regla de aporte aprobada. [Trazabilidad](trazabilidad.md).

**Antecedente histórico:** ADR-002 (2026-10-18) concretó preselección de cinco actividades, captura con fuente y objetivo crítico/cumplimiento conjunto. Esas reglas funcionales fueron sustituidas por DEC-25/26; el diseño técnico permanece sin modificar y requiere evaluación por el equipo.
