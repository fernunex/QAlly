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
Implementar límites y protocolo aprobados: PDF 3 MiB, enlaces HTTP/HTTPS, reserva/compensación y limpieza diaria. [Seguridad](../datos/seguridad-integridad.md).

## Lectura mínima para Codex
1. Este archivo y `CU-04.md` enlazado.
2. Reglas globales **solo** si hay dudas de permisos, etapas, catálogo o estados.
3. RF/RNF específicos, no el catálogo completo salvo tarea de documentación/pruebas.

**Nota:** este archivo orienta el trabajo; el caso de uso y el registro de decisiones son las fuentes de detalle.

## Consideración técnica de implementación
PDF en Supabase Storage privado y metadata en PostgreSQL; implementar la reserva de archivo físico, confirmación atómica y limpieza aprobadas, sin presentar preparación como entrega enviada.
