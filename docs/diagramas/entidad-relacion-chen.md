# Modelo entidad–relación — vista Chen simplificada

Vista de las **14 tablas del esquema público** y su vínculo con `auth.users`. Rectángulos = entidades; rombos = relaciones; óvalos = atributos seleccionados. PK identifica la llave primaria. Las entidades conservan los nombres físicos de las migraciones para poder compararlas con PostgreSQL.

Las etiquetas de cardinalidad se leen por extremos: `proyecto — 1 — contiene — 0..N — actividad_sqa` significa que cada actividad pertenece a un proyecto y que un proyecto puede tener ninguna o muchas actividades.

```mermaid
flowchart TB
    AU["auth.users<br/>Supabase Auth"]
    PE["perfil"]
    PR["proyecto"]
    PP["participacion_proyecto"]
    ET["etapa"]
    TA["tipo_actividad"]
    TM["tipo_metrica"]
    AC["actividad_sqa"]
    EN["entrega"]
    EV["evidencia"]
    AR["archivo_evidencia"]
    RE["revision_entrega"]
    MP["metrica_proyecto"]
    ME["medicion"]
    RM["revision_medicion"]

    R1{"identifica"}
    AU ---|"1"| R1
    R1 ---|"0..1"| PE
    R2{"participa"}
    PE ---|"1"| R2
    R2 ---|"0..N"| PP
    R3{"autoriza participación"}
    PR ---|"1"| R3
    R3 ---|"1..N"| PP
    R4{"clasifica actividades"}
    ET ---|"1"| R4
    R4 ---|"0..N"| TA
    R5{"clasifica métricas"}
    ET ---|"1"| R5
    R5 ---|"0..N"| TM
    R6{"contiene actividades"}
    PR ---|"1"| R6
    R6 ---|"0..N"| AC
    R7{"origina instancia"}
    TA ---|"1"| R7
    R7 ---|"0..N"| AC
    R8{"responsable del proyecto"}
    PP ---|"0..1"| R8
    R8 ---|"0..N"| AC
    R9{"tiene intentos"}
    AC ---|"1"| R9
    R9 ---|"0..N"| EN
    R10{"adjunta"}
    EN ---|"1"| R10
    R10 ---|"0..N"| EV
    R11{"recibe revisión QA"}
    EN ---|"1"| R11
    R11 ---|"0..1"| RE
    R12{"referencia PDF"}
    AR ---|"0..1"| R12
    R12 ---|"0..N"| EV
    R13{"contiene archivos"}
    PR ---|"1"| R13
    R13 ---|"0..N"| AR
    R14{"origina reserva"}
    EN ---|"1"| R14
    R14 ---|"0..N"| AR
    R15{"configura"}
    PR ---|"1"| R15
    R15 ---|"0..N"| MP
    R16{"define tipo"}
    TM ---|"1"| R16
    R16 ---|"0..N"| MP
    R17{"registra mediciones"}
    MP ---|"1"| R17
    R17 ---|"0..N"| ME
    R18{"conserva revisiones"}
    ME ---|"1"| R18
    R18 ---|"1..N"| RM

    PE --- A1(["usuario_id · PK/FK"])
    PE --- A2(["nombre"])
    PE --- A3(["rol"])
    PR --- A4(["id · PK"])
    PR --- A5(["nombre"])
    PR --- A6(["cerrado_en"])
    PP --- A7(["proyecto_id · PK/FK"])
    PP --- A8(["usuario_id · PK/FK"])
    ET --- A9(["codigo · PK"])
    ET --- A10(["nombre"])
    TA --- A11(["id · PK"])
    TA --- A12(["codigo"])
    TM --- A13(["id · PK"])
    TM --- A14(["codigo"])
    AC --- A15(["id · PK"])
    AC --- A16(["estado"])
    EN --- A17(["id · PK"])
    EN --- A18(["numero_intento"])
    EV --- A19(["id · PK"])
    EV --- A20(["tipo · PDF / Enlace"])
    AR --- A21(["id · PK"])
    AR --- A22(["nombre_archivo"])
    RE --- A23(["id · PK"])
    RE --- A24(["decision"])
    MP --- A25(["id · PK"])
    MP --- A26(["objetivo"])
    ME --- A27(["id · PK"])
    ME --- A28(["medida_en"])
    RM --- A29(["medicion_id · PK/FK"])
    RM --- A30(["numero_revision · PK"])
    RM --- A31(["valor"])

    classDef entidad fill:#e8f0fe,stroke:#1d4ed8,color:#172554;
    classDef relacion fill:#fff7df,stroke:#a16207,color:#713f12;
    classDef atributo fill:#ffffff,stroke:#64748b,color:#0f172a;
    class AU,PE,PR,PP,ET,TA,TM,AC,EN,EV,AR,RE,MP,ME,RM entidad;
    class R1,R2,R3,R4,R5,R6,R7,R8,R9,R10,R11,R12,R13,R14,R15,R16,R17,R18 relacion;
    class A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,A13,A14,A15,A16,A17,A18,A19,A20,A21,A22,A23,A24,A25,A26,A27,A28,A29,A30,A31 atributo;
```

## Reglas que complementan la vista

- `perfil.rol` admite QA o Miembro del equipo. El rol es global; `participacion_proyecto` autoriza acceso al proyecto. No existe una tabla adicional de roles ni un rol diferente por participación.
- La PK de `participacion_proyecto` es `(proyecto_id, usuario_id)`. La asignación usa una FK compuesta hacia esa participación; además se exige rol Miembro. Puede faltar responsable solo mientras la actividad está Pendiente.
- `metrica_proyecto` tiene unicidad `(proyecto_id, tipo_metrica_id)`. En actividades no existe esa unicidad: un tipo puede instanciarse varias veces en el mismo proyecto.
- La etapa de actividades y métricas procede de su catálogo, no de un campo libre en cada instancia. Catálogos y etapas son entidades diferentes.
- Cada proyecto válido incorpora al menos la participación del QA creador mediante la RPC de alta; la cardinalidad mínima no procede de una FK aislada.
- Cada actividad tiene intentos numerados y como máximo un borrador. Una entrega enviada conserva resultado/evidencias; recibe a lo sumo una revisión QA. Una devolución permite crear otro intento.
- Cada evidencia es PDF **o** enlace. Solo PDF tiene `archivo_id`; una evidencia de enlace tiene URL. El archivo físico puede reutilizarse en referencias de varios intentos y mantenerse temporalmente sin referencias por el protocolo de reserva/limpieza.
- Cada medición se crea junto a su revisión inicial; las correcciones anexan revisiones. `revision_medicion` tiene PK `(medicion_id, numero_revision)`.
- Se omiten del dibujo la mayoría de atributos y las relaciones de auditoría con perfil: creador/cierre del proyecto, creador de actividad/medición/archivo, autor de entrega/evidencia/revisión de medición, QA revisor y configurador de objetivos. Sus FK, fechas y versiones permanecen en el esquema y el diccionario. `auth.users` es externa al esquema público; Storage guarda el binario y no aparece como una entidad de negocio adicional.

No hay tablas de puntajes de salud ni histórico de reportes inventados. Esta vista no cambia cardinalidades ni reglas del modelo aprobado; las restricciones condicionales e invariantes se aplican mediante FK, índices, funciones y RLS.

Fuentes: [migración de esquema](../../supabase/migrations/20261018000100_esquema.sql), [ER completo](../datos/modelo-entidad-relacion.md), [diccionario](../datos/diccionario-datos.md) y [seguridad e integridad](../datos/seguridad-integridad.md).
