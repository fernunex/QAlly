# Integración de interfaz y base de datos

**Fecha: 2026-10-19. Estado: integración local completada y validada.** El usuario aprobó ejecutar el plan para reunir las bases antes de desarrollar los casos de uso. No modifica las reglas de ADR-001/002 ni requiere Cloud.

**Actualización posterior:** CU-01 a CU-04 y la sesión real están implementados e integrados en `dev`. Las referencias a demo, cuentas del prototipo y backend pendiente de este registro describen el estado histórico de la primera integración UI/BD. Para operar la versión actual, usar el [README](../../README.md), la [guía Supabase](../datos/guia-supabase.md) y los [resultados conjuntos](integracion-cu02-cu03-cu04.md).

## Ramas y alcance

- `main`: versión estable de referencia; se mantiene sin cambios en esta integración.
- `dev`: base común de UI y BD, con funcionalidades verificadas que se incorporan progresivamente.
- `chore/integrar-ui-bd`: integración de `base/supabase-bootstrap` (`22353e9`) y `origin/feat/ui-base` (`3c9b969`).
- `feat/cu01-gestion-proyectos`: rama siguiente, creada desde `dev` una vez validada la integración.

Se conservan ambas historias. La unión resuelve conflictos add/add en package.json, package-lock.json y tsconfig.json. Se combinan scripts/dependencias y se regenera el lockfile con npm; no se elige el archivo completo de una rama descartando la otra. TypeScript 5.9.3 mantiene compatibilidad con ESLint de Next.js; se conservan Node 24 y las herramientas Supabase/Vitest. Next.js genera los tipos de rutas antes de ejecutar tsc.

## Desarrollo local

```sh
npm ci
npm run db:start
npm run db:seed
npm run dev -- --hostname 127.0.0.1
```

Aplicación: http://127.0.0.1:3000. Studio: http://127.0.0.1:54323. Datos y credenciales locales en archivo ignorado, según la [guía de Supabase](../datos/guia-supabase.md). No hay proyecto Cloud enlazado.

La UI conserva la sesión demo y `src/lib/mock/`; no persiste las operaciones en Supabase. Cuentas de interfaz: `david@equipo.dev` / `emi@equipo.dev`, contraseña demo no vacía. Las seis cuentas de Auth del seed son otras identidades; no se presupone correspondencia de IDs entre ejemplos UI y BD.

## Flujo para el equipo

Actualizar `dev` desde GitHub antes de crear una rama de funcionalidad. Tras publicar estas ramas y configurar el seguimiento remoto, el flujo habitual es:

```sh
git switch dev
git pull --ff-only origin dev
git switch -c feat/nombre-del-cambio
```

Trabajar en esa rama y abrir PR hacia `dev`, con revisión de otro integrante y checks de aplicación/BD. Incorporar cambios nuevos de `dev` cuando sea necesario y coordinar modificaciones de contratos, migraciones y configuración compartida. Promover versiones verificadas de `dev` a `main` mediante PR. No se requieren ramas permanentes adicionales.

Los workflows de aplicación y BD se ejecutan en PR y en push a `dev`/`main`. Publicar ramas, configurar protecciones en GitHub y revisión por pares quedan a cargo del equipo; no se presume que las pruebas locales equivalgan a una ejecución de GitHub Actions.

## Desarrollo siguiente: CU-01

1. Sustituir la sesión demo por Supabase Auth local y verificación en servidor; leer perfil real y participación.
2. Conectar listado y detalle de proyectos autorizados, catálogos y miembros elegibles.
3. Conectar el asistente existente al alta atómica/idempotente de proyecto y configuración inicial.
4. Conectar edición y cierre con versión esperada, confirmación, errores y conservación de consulta.
5. Verificar permisos QA/Miembro, acceso ajeno, reintentos, persistencia y solo lectura tras cierre, incluyendo Chrome/Firefox.

Reutilizar componentes de UI y tipos generados; adaptar las formas de datos según contratos aprobados. No copiar los mocks a la BD ni enviar claves privilegiadas al navegador. Nuevas reglas o cambios de esquema/contratos requieren aprobación. Fuente de alcance: [módulo proyectos](../modulos/proyectos.md), CU-01 y contratos v1.

## Verificación

Comprobado localmente con Node.js 24.18.1 y npm 12.0.2:

- `npm ci` y `npm ls --depth=0`: instalación reproducible y dependencias directas sin conflictos de pares.
- `npm run lint`: cero errores y cero advertencias. Se retiraron dos bindings sin uso en scripts/pruebas, sin cambiar lógica.
- `npm run typecheck`: generación de rutas y TypeScript correctos.
- `npm run build`: compilación, chequeo de tipos y prerender correctos con Next.js 16.4.2.
- `npm run db:lint`: sin errores; `npm run db:types`: sin diferencias respecto de los tipos versionados.
- `npm run db:test`: veinte pruebas aprobadas contra Supabase local; sin cambios de esquema ni reset de datos durante la integración.
- Servidor de producción: ocho rutas respondieron 200 con el contenido esperado (login, proyectos, alta, mis actividades como Miembro y cuatro vistas de proyecto). Sin sesión demo se emitió redirección a login.
- Firefox 157.0 en modo headless: captura e inspección visual del login a 1366×900 correctas. Es una comprobación de integración, no una aceptación completa de los flujos en navegadores.
- Servidor de desarrollo sobre 127.0.0.1:3000: login responde correctamente. Bundles estáticos revisados sin las credenciales locales privilegiadas.

CI queda configurada, pero todavía no se ha ejecutado en GitHub. Las ramas y commits son locales; no se realizó push ni despliegue. Se mantiene `main` en la versión previa, se integra el resultado validado a `dev` y se crea `feat/cu01-gestion-proyectos` desde allí.

### Dependencias pendientes de seguimiento

`npm audit` reporta **nueve avisos high**, siete con `--omit=dev`, todos asociados a la dependencia transitiva `braces` a través de herramientas de Next/shadcn. [Aviso oficial GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm): versiones afectadas hasta 3.0.3 y sin versión corregida indicada a la fecha de revisión. No se ejecutó `npm audit fix --force`, que proponía degradar versiones principales de Next/shadcn. Se conserva la UI recibida; revisar remediación al actualizar esas herramientas y antes de un despliegue. La integración no declara la auditoría libre de vulnerabilidades.

Esta etapa no implementa el backend de CU-01 ni certifica los seis casos de uso; prepara su base común. La salud permanece Sin evaluar. La aceptación funcional y los RNF de interfaz/rendimiento se comprobarán al conectar cada caso de uso.
