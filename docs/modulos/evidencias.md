# Módulo: Entrega de evidencia SQA

**Caso de uso:** [CU-04](../requisitos/casos-uso/CU-04.md)  
**RF:** RF-20 a RF-25, RF-33 → [catálogo](../requisitos/funcionales.md)  
**RNF aplicables:** [matriz de trazabilidad](../requisitos/trazabilidad.md); [criterios de prueba](../requisitos/no-funcionales.md).

## Objetivo
Miembro consulta sus actividades, inicia una Pendiente, registra resultado, adjunta PDF/enlace, envía a revisión y corrige entregas devueltas.

## Reglas esenciales acordadas
Solo inicia/elabora el asignado; no enviar sin resultado y evidencia; En revisión y Aprobada sin edición ordinaria.

## Interfaces y dependencias
Estados/permiso de actividades (CU-03); almacenamiento de PDFs y protección de evidencias.

## Pendientes relevantes
BD/RLS, bucket privado y adaptador de archivos de scripts implementados y probados localmente: PDF 3 MiB, enlaces HTTP/HTTPS y reserva/compensación; comando de limpieza disponible. Falta integrar el adaptador al servidor Next.js, conectar la UI de CU-04 y probar su flujo completo; programar la limpieza diaria al preparar el despliegue. [Guía Supabase](../datos/guia-supabase.md) y [seguridad](../datos/seguridad-integridad.md).

## Lectura mínima para Codex
1. Este archivo y `CU-04.md` enlazado.
2. Reglas globales **solo** si hay dudas de permisos, etapas, catálogo o estados.
3. RF/RNF específicos, no el catálogo completo salvo tarea de documentación/pruebas.

**Nota:** este archivo orienta el trabajo; el caso de uso y el registro de decisiones son las fuentes de detalle.

## Consideración técnica de implementación
PDF en Supabase Storage privado y metadata en PostgreSQL; reutilizar la reserva de archivo físico, confirmación atómica y limpieza aprobadas, sin presentar preparación como entrega enviada. La credencial privilegiada del adaptador permanece exclusivamente en servidor.
