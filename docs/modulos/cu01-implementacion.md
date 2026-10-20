# CU-01 — Implementación y validación local

**Fecha: 2026-10-19. Estado: implementado y validado localmente.** El usuario aprobó ejecutar el plan completo. Fuente de alcance: [CU-01](../requisitos/casos-uso/CU-01.md), RF-01 a RF-07/RF-33, RNF asociados y [contratos v1](../arquitectura/contratos-v1.md). Sin nuevas migraciones ni cambios de reglas de negocio.

Implementación registrada en el commit `15731f1` de `feat/cu01-gestion-proyectos`; integrado en `dev` mediante `47ddd3a`. La documentación se mantiene en un commit separado.

## Uso local

```sh
npm ci
npm run db:start
npm run db:seed
npm run dev -- --hostname 127.0.0.1
```

Para la preparación inicial y la generación de `.env.local`, seguir primero la [guía Supabase](../datos/guia-supabase.md). El seed es de desarrollo local; E2E añade sus propios datos ficticios.

Abrir http://127.0.0.1:3000. Usar `qa1@qally.example.test`, `qa2@qally.example.test` o `miembro1@qally.example.test`..`miembro4@qally.example.test`. Contraseña: valor local de `QALLY_DEV_PASSWORD` en `.env.local`, nunca en documentación ni logs. Las cuentas del prototipo `david@equipo.dev`/`emi@equipo.dev` y la cookie demo ya no conceden acceso. No hay registro público ni selector para suplantar otro rol.

QA puede crear proyectos con información general, miembros, actividades y métricas seleccionadas; consultar, editar los cinco campos generales y cerrar tras confirmación. Miembro consulta únicamente proyectos autorizados. Cerrar conserva datos y bloquea escrituras; no hay reapertura ni administración posterior de miembros.

## Realización técnica

- `src/lib/supabase/server.ts` y `src/proxy.ts`: cliente SSR por petición, verificación/renovación de identidad con Auth y cookies HttpOnly/SameSite=Lax. Cookie Secure al operar en producción con Supabase HTTPS. Respuestas de rutas protegidas privadas y sin caché compartida. `connection()` evita que tareas internas del SDK que consultan el reloj se ejecuten durante prerender.
- `src/lib/session.ts` y `session-actions.ts`: login/logout reales y perfil leído de PostgreSQL. `cache` de React deduplica dentro de una petición; no almacena sesiones de distintos usuarios en una caché global. La autorización no depende solo del proxy, de ocultar controles o de la cookie sin verificar.
- `src/features/projects/server/queries.ts`: lecturas con la sesión del usuario y RLS, catálogos activos, búsqueda de miembros por nombre y paginación por cursor. Las listas generales se ordenan por creación/ID descendentes; el directorio usa el cursor UUID de la RPC aprobada. Los conteos de la lista se incluyen en la consulta, sin recorrer cada actividad ni emitir consultas por cada proyecto.
- `src/features/projects/actions.ts`: Server Actions pequeñas, autorización QA/participación/estado, validación estricta Zod y llamadas a `crear_proyecto`, `editar_proyecto`, `cerrar_proyecto`. Next.js verifica el origen de estas mutaciones; cada acción vuelve a autorizar aunque se invoque directamente. Sin credencial de servicio en CU-01.
- `validation.ts`, `pagination.ts` y `src/lib/resultados.ts`: entradas estrictas, fechas/cotas, objetivos decimales, UUID/cursor y errores públicos aprobados. Versiones bigint y objetivos se transportan como cadenas; SELECT convierte a texto antes de serializar JSON. La adaptación de argumentos RPC no convierte versiones a Number.
- Los componentes existentes de asistente, edición, menú de cierre, tablas y estados se reutilizan. Catálogos toman IDs/etapas/preselección de BD; los textos y objetivos iniciales son metadata v1 aprobada. `requerimientos` de BD se adapta a `requisitos` de UI y `Miembro del equipo` a la abreviatura interna `Miembro`; las etiquetas visibles conservan los nombres del producto. El selector no solicita correos ajenos.

Crear usa una única transacción y una solicitud estable por formulario. Ante una respuesta perdida, el formulario conserva solicitud/datos y permite reintentar sin duplicar; mientras exista incertidumbre los campos permanecen bloqueados. El aviso de salida indica que el proyecto puede haberse guardado. Editar/cerrar envían versión esperada; un conflicto no sobrescribe y ofrece recargar. No se muestra éxito antes de confirmación. Las pantallas se revalidan tras guardar.

## Alcance conservado

El detalle muestra información general, participantes, conteos y configuración de actividades/métricas con datos reales; actividades paginadas y métricas sin recorrer sus historiales. Salud permanece Sin evaluar, sin cálculos nuevos. CU-02/03/04 ya conectan gestión de métricas/mediciones, actividades SQA y entrega/revisión de evidencias; consultar la [integración conjunta](../equipo/integracion-cu02-cu03-cu04.md). CU-05/06 conservan componentes de prototipo para reutilizarlos; sus rutas no presentan guardados simulados como si fueran datos del proyecto real. Salud y reportes siguen pendientes.

Dependencias añadidas del stack autorizado: `@supabase/ssr` 0.12.7, Zod 4.6.7 y `@playwright/test` 1.64.1, fijadas en package.json/lockfile. Next.js 16.4.2, TypeScript 5.9.3 y Supabase JS 2.118.0 se conservan.

## Pruebas reproducibles

```sh
npm run unit:test
npm run db:test
npm run db:lint
npm run typecheck
npm run lint
npx playwright install chromium firefox
npm run e2e:test
```

E2E requiere Docker/Supabase local iniciado y el puerto 3100 libre. Compila y sirve una versión de producción, prepara fixtures por Auth Admin API/RPC y verifica por navegador. El setup rechaza destinos fuera de `http://127.0.0.1:54321`. Añade 26 proyectos de listado, un proyecto con 30 actividades, 26 miembros de directorio y proyectos aislados por ejecución. No borra datos existentes. Traces y video desactivados; resultados/capturas de fallos ignorados por Git. No compartir archivos de entorno ni diagnósticos que contengan sesiones.

El proyecto `chrome` usa por defecto Chrome for Testing incluido con Playwright; no se presume que ese build sea el canal estable. Para comprobar un Chrome estable instalado o descargado desde [Chrome for Testing oficial](https://googlechromelabs.github.io/chrome-for-testing/), indicar su ejecutable:

```sh
QALLY_CHROME_PATH=/ruta/al/chrome npm run e2e:test
```

## Resultado comprobado

- **21 pruebas unitarias aprobadas**: normalización, fechas reales y rangos, límites, selecciones vacías admitidas, duplicados, propiedades ajenas, versiones exactas, decimales/objetivos, cursores y errores seguros.
- **20 pruebas de integración de BD aprobadas**, sin modificar las migraciones existentes. SQL lint sin errores; regenerar tipos de BD no produce diferencias.
- **18 escenarios E2E aprobados**: ocho escenarios completos por navegador más un caso adicional por navegador de sesión sin renovación. Se comprobó con Chrome for Testing **Stable 155.0.8059.84** y Firefox de Playwright **157.0**, en Linux x86_64 local, Node 24.18.1 y Docker 29.8.2. Ejecución completa inicial de 16 escenarios: 2,0 minutos; el caso adicional de sesión: 2 escenarios en 22,3 segundos. No son tiempos por operación RNF.
- Se verifica login inválido, cookie demo ignorada, logout, renovación y rechazo de sesión sin renovación, aislamiento entre usuarios, alta/consulta/edición/cierre persistentes, configuración/etapas, búsqueda y paginación, acceso ajeno/inexistente indistinguible, conflictos entre pestañas, respuesta perdida con un único alta, y llamadas directas como Miembro/usuario ajeno/sin sesión. Entradas manipuladas se rechazan en servidor.
- Lint, generación de rutas, TypeScript y build aprobados. Los workflows incorporan unitarias y E2E con Supabase local, sin secretos Cloud; aún no ejecutados en GitHub.

La validación demuestra CU-01 y sus controles locales; no certifica todos los RNF de los seis CU. RNF-04/05 requieren diez mediciones por vista/operación en entorno desplegado y representativo: quedan pendientes de esa etapa, sin necesitar Cloud para desarrollar. Los avisos de auditoría transitivos ya registrados en la integración siguen pendientes de seguimiento; no se aplicaron degradaciones forzadas de Next/shadcn. No se hizo push ni despliegue.
