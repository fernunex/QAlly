-- Datos de referencia obligatorios en cualquier entorno; no son ejemplos de desarrollo.
begin;
insert into public.etapa(codigo,nombre,orden) values
('requerimientos','Especificación de requerimientos',1),('diseno','Diseño del software',2),('desarrollo','Desarrollo',3);
insert into public.tipo_actividad(id,codigo,nombre,descripcion,etapa_codigo,preseleccionada) values
('7c700beb-dfb5-51b0-80ba-078ecff63df9','A-01','Revisión de la documentación de requisitos','Alcance/versión revisada, hallazgos y conclusión; PDF o enlace al informe/checklist y documentos revisados.','requerimientos',true),
('4bbcb2e1-97c3-597d-aa04-dbbc6e75b0e1','A-02','Realizar trazabilidad de requerimientos','Relaciones documentadas entre requisitos y sus fuentes; PDF o enlace a la matriz.','requerimientos',false),
('38599dc7-f092-5a01-be7b-18fd87e459fd','A-03','Revisión de la documentación de diseño','Versión de diseño, revisión de coherencia con requisitos y hallazgos; PDF o enlace al informe y diseño.','diseno',true),
('b98c951a-2802-5116-97a2-0af0f525e02e','A-04','Realizar trazabilidad de diseño','Relación entre requisitos y elementos de diseño; PDF o enlace a matriz/documento.','diseno',false),
('d8a5ec1a-8046-5229-bacc-7693844ba628','A-05','Análisis de código estático automático','Herramienta, versión/commit, alcance, resultados y tratamiento; PDF o enlace a ejecución/informe.','desarrollo',true),
('e3a90ca9-52b6-5144-9b6a-185d43b20e5e','A-06','Revisión por pares (Code Review)','Cambios revisados, revisor y conclusión; PDF o enlace a PR/registro de revisión.','desarrollo',true),
('d173aacb-1b4b-57f9-94df-e920475fd566','A-07','Administración de cambios de repositorio (GitHub)','Cambios o periodo examinado y seguimiento de versiones; PDF o enlace a commits/PR/registro.','desarrollo',false),
('d148fca0-3767-529e-9c29-433db155837a','A-08','Revisión personal de código','Código/commit revisado, checklist y hallazgos; PDF o enlace al registro.','desarrollo',false),
('c9019a6a-a659-51fc-bece-6ea07e19ddd2','A-09','Realizar pruebas (Testing)','Casos/alcance, entorno, versión, resultados y fallos; PDF o enlace a reporte.','desarrollo',true),
('ea7d7769-7225-5375-a2ed-a3044ffd8fcf','A-10','Realizar trazabilidad de pruebas','Relación requisitos–casos–resultados; PDF o enlace a matriz.','desarrollo',false);
insert into public.tipo_metrica(id,codigo,nombre,etapa_codigo,unidad,definicion_clave) values
('192e07bd-43f3-595f-b615-bdb8fe6f3399','M-01','Tasa de pruebas aprobadas','desarrollo','%','m01_pruebas_v1'),
('fc98d477-adc5-5923-9122-4324b889372e','M-02','Porcentaje de PR revisados','desarrollo','%','m02_pr_v1'),
('fbb31d90-520c-517d-974d-7be0e642aaae','M-03','Cobertura de requisitos probados','desarrollo','%','m03_requisitos_v1'),
('4317248b-f600-5bc8-8072-7d5d09368844','M-04','Defectos de alta severidad abiertos','desarrollo','defectos','m04_defectos_v1');
commit;
