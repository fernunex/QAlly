
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {

  "public": {
          Tables: {
            "actividad_sqa": {
                  Row: {
                    "creado_en": string,"creado_por": string,"descripcion": string,"estado": string,"id": string,"proyecto_id": string,"responsable_id": string | null,"tipo_actividad_id": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "creado_en"?: string,"creado_por": string,"descripcion": string,"estado"?: string,"id"?: string,"proyecto_id": string,"responsable_id"?: string | null,"tipo_actividad_id": string,"version"?: number
                  }
                  Update: {
                    "creado_en"?: string,"creado_por"?: string,"descripcion"?: string,"estado"?: string,"id"?: string,"proyecto_id"?: string,"responsable_id"?: string | null,"tipo_actividad_id"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "actividad_sqa_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "perfil"
      referencedColumns: ["usuario_id"]
    },{
      foreignKeyName: "actividad_sqa_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "proyecto"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "actividad_sqa_proyecto_id_responsable_id_fkey"
      columns: ["proyecto_id","responsable_id"]
isOneToOne: false
      referencedRelation: "participacion_proyecto"
      referencedColumns: ["proyecto_id","usuario_id"]
    },{
      foreignKeyName: "actividad_sqa_tipo_actividad_id_fkey"
      columns: ["tipo_actividad_id"]
isOneToOne: false
      referencedRelation: "tipo_actividad"
      referencedColumns: ["id"]
    }
                  ]
                },"archivo_evidencia": {
                  Row: {
                    "actualizado_en": string,"creado_en": string,"creado_por": string,"entrega_origen_id": string,"estado": string,"id": string,"mime_type": string,"nombre_archivo": string,"proyecto_id": string,"reserva_hasta": string,"ruta_objeto": string,"sha256": string,"sin_referencias_desde": string | null,"tamano_bytes": number
                  }
                  ComputedFields: never
                  Insert: {
                    "actualizado_en"?: string,"creado_en"?: string,"creado_por": string,"entrega_origen_id": string,"estado"?: string,"id"?: string,"mime_type": string,"nombre_archivo": string,"proyecto_id": string,"reserva_hasta"?: string,"ruta_objeto": string,"sha256": string,"sin_referencias_desde"?: string | null,"tamano_bytes": number
                  }
                  Update: {
                    "actualizado_en"?: string,"creado_en"?: string,"creado_por"?: string,"entrega_origen_id"?: string,"estado"?: string,"id"?: string,"mime_type"?: string,"nombre_archivo"?: string,"proyecto_id"?: string,"reserva_hasta"?: string,"ruta_objeto"?: string,"sha256"?: string,"sin_referencias_desde"?: string | null,"tamano_bytes"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "archivo_evidencia_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "perfil"
      referencedColumns: ["usuario_id"]
    },{
      foreignKeyName: "archivo_evidencia_entrega_origen_id_fkey"
      columns: ["entrega_origen_id"]
isOneToOne: false
      referencedRelation: "entrega"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "archivo_evidencia_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "proyecto"
      referencedColumns: ["id"]
    }
                  ]
                },"entrega": {
                  Row: {
                    "actividad_id": string,"autor_id": string,"creada_en": string,"enviada_en": string | null,"id": string,"numero_intento": number,"resultado": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "actividad_id": string,"autor_id": string,"creada_en"?: string,"enviada_en"?: string | null,"id"?: string,"numero_intento": number,"resultado"?: string | null
                  }
                  Update: {
                    "actividad_id"?: string,"autor_id"?: string,"creada_en"?: string,"enviada_en"?: string | null,"id"?: string,"numero_intento"?: number,"resultado"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "entrega_actividad_id_fkey"
      columns: ["actividad_id"]
isOneToOne: false
      referencedRelation: "actividad_sqa"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "entrega_autor_id_fkey"
      columns: ["autor_id"]
isOneToOne: false
      referencedRelation: "perfil"
      referencedColumns: ["usuario_id"]
    }
                  ]
                },"etapa": {
                  Row: {
                    "codigo": string,"nombre": string,"orden": number
                  }
                  ComputedFields: never
                  Insert: {
                    "codigo": string,"nombre": string,"orden": number
                  }
                  Update: {
                    "codigo"?: string,"nombre"?: string,"orden"?: number
                  }
                  Relationships: [

                  ]
                },"evidencia": {
                  Row: {
                    "archivo_id": string | null,"autor_id": string,"creada_en": string,"entrega_id": string,"id": string,"tipo": string,"url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "archivo_id"?: string | null,"autor_id": string,"creada_en"?: string,"entrega_id": string,"id"?: string,"tipo": string,"url"?: string | null
                  }
                  Update: {
                    "archivo_id"?: string | null,"autor_id"?: string,"creada_en"?: string,"entrega_id"?: string,"id"?: string,"tipo"?: string,"url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "evidencia_archivo_id_fkey"
      columns: ["archivo_id"]
isOneToOne: false
      referencedRelation: "archivo_evidencia"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "evidencia_autor_id_fkey"
      columns: ["autor_id"]
isOneToOne: false
      referencedRelation: "perfil"
      referencedColumns: ["usuario_id"]
    },{
      foreignKeyName: "evidencia_entrega_id_fkey"
      columns: ["entrega_id"]
isOneToOne: false
      referencedRelation: "entrega"
      referencedColumns: ["id"]
    }
                  ]
                },"medicion": {
                  Row: {
                    "creada_en": string,"creada_por": string,"id": string,"medida_en": string,"metrica_proyecto_id": string,"orden_registro": number
                  }
                  ComputedFields: never
                  Insert: {
                    "creada_en"?: string,"creada_por": string,"id": string,"medida_en": string,"metrica_proyecto_id": string,"orden_registro"?: never
                  }
                  Update: {
                    "creada_en"?: string,"creada_por"?: string,"id"?: string,"medida_en"?: string,"metrica_proyecto_id"?: string,"orden_registro"?: never
                  }
                  Relationships: [
                    {
      foreignKeyName: "medicion_creada_por_fkey"
      columns: ["creada_por"]
isOneToOne: false
      referencedRelation: "perfil"
      referencedColumns: ["usuario_id"]
    },{
      foreignKeyName: "medicion_metrica_proyecto_id_fkey"
      columns: ["metrica_proyecto_id"]
isOneToOne: false
      referencedRelation: "metrica_proyecto"
      referencedColumns: ["id"]
    }
                  ]
                },"metrica_proyecto": {
                  Row: {
                    "configurada_en": string,"configurada_por": string,"id": string,"objetivo": number,"objetivo_critico": number | null,"operador": string,"proyecto_id": string,"tipo_metrica_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "configurada_en"?: string,"configurada_por": string,"id"?: string,"objetivo": number,"objetivo_critico"?: number | null,"operador": string,"proyecto_id": string,"tipo_metrica_id": string
                  }
                  Update: {
                    "configurada_en"?: string,"configurada_por"?: string,"id"?: string,"objetivo"?: number,"objetivo_critico"?: number | null,"operador"?: string,"proyecto_id"?: string,"tipo_metrica_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "metrica_proyecto_configurada_por_fkey"
      columns: ["configurada_por"]
isOneToOne: false
      referencedRelation: "perfil"
      referencedColumns: ["usuario_id"]
    },{
      foreignKeyName: "metrica_proyecto_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "proyecto"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "metrica_proyecto_tipo_metrica_id_fkey"
      columns: ["tipo_metrica_id"]
isOneToOne: false
      referencedRelation: "tipo_metrica"
      referencedColumns: ["id"]
    }
                  ]
                },"participacion_proyecto": {
                  Row: {
                    "asociada_en": string,"proyecto_id": string,"usuario_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "asociada_en"?: string,"proyecto_id": string,"usuario_id": string
                  }
                  Update: {
                    "asociada_en"?: string,"proyecto_id"?: string,"usuario_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "participacion_proyecto_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "proyecto"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "participacion_proyecto_usuario_id_fkey"
      columns: ["usuario_id"]
isOneToOne: false
      referencedRelation: "perfil"
      referencedColumns: ["usuario_id"]
    }
                  ]
                },"perfil": {
                  Row: {
                    "nombre": string,"rol": string,"usuario_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "nombre": string,"rol": string,"usuario_id": string
                  }
                  Update: {
                    "nombre"?: string,"rol"?: string,"usuario_id"?: string
                  }
                  Relationships: [

                  ]
                },"proyecto": {
                  Row: {
                    "actualizado_en": string,"cerrado_en": string | null,"cerrado_por": string | null,"creado_en": string,"creado_por": string,"descripcion": string,"fecha_fin_prevista": string | null,"fecha_inicio": string,"id": string,"nombre": string,"periodo_academico": string | null,"solicitud_creacion_hash": string,"solicitud_creacion_id": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "actualizado_en"?: string,"cerrado_en"?: string | null,"cerrado_por"?: string | null,"creado_en"?: string,"creado_por": string,"descripcion": string,"fecha_fin_prevista"?: string | null,"fecha_inicio": string,"id"?: string,"nombre": string,"periodo_academico"?: string | null,"solicitud_creacion_hash": string,"solicitud_creacion_id": string,"version"?: number
                  }
                  Update: {
                    "actualizado_en"?: string,"cerrado_en"?: string | null,"cerrado_por"?: string | null,"creado_en"?: string,"creado_por"?: string,"descripcion"?: string,"fecha_fin_prevista"?: string | null,"fecha_inicio"?: string,"id"?: string,"nombre"?: string,"periodo_academico"?: string | null,"solicitud_creacion_hash"?: string,"solicitud_creacion_id"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "proyecto_cerrado_por_fkey"
      columns: ["cerrado_por"]
isOneToOne: false
      referencedRelation: "perfil"
      referencedColumns: ["usuario_id"]
    },{
      foreignKeyName: "proyecto_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "perfil"
      referencedColumns: ["usuario_id"]
    }
                  ]
                },"revision_entrega": {
                  Row: {
                    "decision": string,"entrega_id": string,"id": string,"observaciones": string | null,"qa_id": string,"revisada_en": string
                  }
                  ComputedFields: never
                  Insert: {
                    "decision": string,"entrega_id": string,"id"?: string,"observaciones"?: string | null,"qa_id": string,"revisada_en"?: string
                  }
                  Update: {
                    "decision"?: string,"entrega_id"?: string,"id"?: string,"observaciones"?: string | null,"qa_id"?: string,"revisada_en"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "revision_entrega_entrega_id_fkey"
      columns: ["entrega_id"]
isOneToOne: true
      referencedRelation: "entrega"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "revision_entrega_qa_id_fkey"
      columns: ["qa_id"]
isOneToOne: false
      referencedRelation: "perfil"
      referencedColumns: ["usuario_id"]
    }
                  ]
                },"revision_medicion": {
                  Row: {
                    "autor_id": string,"causa_no_evaluable": string | null,"condicion": string,"datos_fuente": NonNullable<Json>,"medicion_id": string,"numero_revision": number,"registrada_en": string,"valor": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "autor_id": string,"causa_no_evaluable"?: string | null,"condicion": string,"datos_fuente": NonNullable<Json>,"medicion_id": string,"numero_revision": number,"registrada_en"?: string,"valor"?: number | null
                  }
                  Update: {
                    "autor_id"?: string,"causa_no_evaluable"?: string | null,"condicion"?: string,"datos_fuente"?: NonNullable<Json>,"medicion_id"?: string,"numero_revision"?: number,"registrada_en"?: string,"valor"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "revision_medicion_autor_id_fkey"
      columns: ["autor_id"]
isOneToOne: false
      referencedRelation: "perfil"
      referencedColumns: ["usuario_id"]
    },{
      foreignKeyName: "revision_medicion_medicion_id_fkey"
      columns: ["medicion_id"]
isOneToOne: false
      referencedRelation: "medicion"
      referencedColumns: ["id"]
    }
                  ]
                },"tipo_actividad": {
                  Row: {
                    "activa": boolean,"codigo": string,"descripcion": string,"etapa_codigo": string,"id": string,"nombre": string,"preseleccionada": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "activa"?: boolean,"codigo": string,"descripcion": string,"etapa_codigo": string,"id"?: string,"nombre": string,"preseleccionada"?: boolean
                  }
                  Update: {
                    "activa"?: boolean,"codigo"?: string,"descripcion"?: string,"etapa_codigo"?: string,"id"?: string,"nombre"?: string,"preseleccionada"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "tipo_actividad_etapa_codigo_fkey"
      columns: ["etapa_codigo"]
isOneToOne: false
      referencedRelation: "etapa"
      referencedColumns: ["codigo"]
    }
                  ]
                },"tipo_metrica": {
                  Row: {
                    "activa": boolean,"codigo": string,"definicion_clave": string,"etapa_codigo": string,"id": string,"nombre": string,"unidad": string
                  }
                  ComputedFields: never
                  Insert: {
                    "activa"?: boolean,"codigo": string,"definicion_clave": string,"etapa_codigo": string,"id"?: string,"nombre": string,"unidad": string
                  }
                  Update: {
                    "activa"?: boolean,"codigo"?: string,"definicion_clave"?: string,"etapa_codigo"?: string,"id"?: string,"nombre"?: string,"unidad"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tipo_metrica_etapa_codigo_fkey"
      columns: ["etapa_codigo"]
isOneToOne: false
      referencedRelation: "etapa"
      referencedColumns: ["codigo"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "agregar_actividad":
{ Args: { "p_descripcion": string,"p_proyecto_id": string,"p_tipo_id": string }; Returns: Json
                           },
"agregar_enlace":
{ Args: { "p_entrega_id": string,"p_url": string,"p_version_esperada": number }; Returns: Json
                           },
"agregar_metrica":
{ Args: { "p_objetivo": number,"p_objetivo_critico"?: number,"p_proyecto_id": string,"p_tipo_id": string }; Returns: Json
                           },
"asignar_responsable":
{ Args: { "p_actividad_id": string,"p_responsable_id": string,"p_version_esperada": number }; Returns: Json
                           },
"buscar_miembros_elegibles":
{ Args: { "p_cursor"?: string,"p_limite"?: number,"p_texto"?: string }; Returns: Json
                           },
"cerrar_proyecto":
{ Args: { "p_proyecto_id": string,"p_version_esperada": number }; Returns: Json
                           },
"configurar_objetivo":
{ Args: { "p_configurada_en_esperada": string,"p_metrica_proyecto_id": string,"p_objetivo": number,"p_objetivo_critico"?: number }; Returns: Json
                           },
"confirmar_archivo":
{ Args: { "p_actor_verificado_id": string,"p_archivo_id": string,"p_version_esperada": number }; Returns: Json
                           },
"confirmar_eliminacion":
{ Args: { "p_archivo_id": string }; Returns: undefined
                           },
"consultar_metrica":
{ Args: { "p_metrica_proyecto_id": string }; Returns: Json
                           },
"consultar_resumen":
{ Args: { "p_proyecto_id": string }; Returns: Json
                           },
"corregir_medicion":
{ Args: { "p_datos_fuente": Json,"p_medicion_id": string,"p_revision_esperada": number }; Returns: Json
                           },
"crear_proyecto":
{ Args: { "p_actividades_tipos_ids"?: (string)[],"p_descripcion": string,"p_fecha_fin_prevista"?: string,"p_fecha_inicio": string,"p_metricas"?: Json,"p_miembros_ids"?: (string)[],"p_nombre": string,"p_periodo_academico"?: string,"p_solicitud_id": string }; Returns: Json
                           },
"editar_proyecto":
{ Args: { "p_descripcion": string,"p_fecha_fin_prevista"?: string,"p_fecha_inicio": string,"p_nombre": string,"p_periodo_academico"?: string,"p_proyecto_id": string,"p_version_esperada": number }; Returns: Json
                           },
"enviar_entrega":
{ Args: { "p_entrega_id": string,"p_version_esperada": number }; Returns: Json
                           },
"guardar_resultado":
{ Args: { "p_entrega_id": string,"p_resultado": string,"p_version_esperada": number }; Returns: Json
                           },
"iniciar_actividad":
{ Args: { "p_actividad_id": string,"p_version_esperada": number }; Returns: Json
                           },
"marcar_limpieza":
{ Args: { "p_archivo_compensacion_id"?: string,"p_limite"?: number }; Returns: Json
                           },
"preparar_entrega":
{ Args: { "p_actividad_id": string,"p_version_esperada": number }; Returns: Json
                           },
"quitar_evidencia":
{ Args: { "p_evidencia_id": string,"p_version_esperada": number }; Returns: Json
                           },
"registrar_medicion":
{ Args: { "p_datos_fuente": Json,"p_medicion_id": string,"p_medida_en": string,"p_metrica_proyecto_id": string }; Returns: Json
                           },
"reservar_archivo":
{ Args: { "p_actor_verificado_id": string,"p_entrega_id": string,"p_metadata_validada": Json,"p_version_esperada": number }; Returns: Json
                           },
"revisar_entrega":
{ Args: { "p_decision": string,"p_entrega_id": string,"p_observaciones"?: string,"p_version_esperada": number }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {

          }
        }
} as const
