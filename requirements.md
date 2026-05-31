# Documento de Requisitos

## Introducción

Sistema SaaS de Gestión de Cosechas Inteligentes orientado a pequeños y medianos productores agrícolas de Chile y Latinoamérica. El MVP provee monitoreo de parcelas, integración con datos climáticos externos, gestión de datos de suelo, alertas básicas, gestión de parcelas y cultivos, autenticación multi-tenant, y una interfaz responsiva mobile-first. Adicionalmente entrega recomendaciones agronómicas en tiempo real para los mejores momentos de siembra y cosecha (considerando los ciclos invertidos del hemisferio sur) y un sistema de recordatorios de tareas agrícolas (riego, poda y fertilización). Para mantener un costo operativo nulo durante el MVP, todos los servicios externos integrados utilizan exclusivamente planes gratuitos. El objetivo es entregar una herramienta accesible y asequible para la toma de decisiones basada en datos en el contexto agrícola del hemisferio sur.

## Glosario

- **Sistema**: La aplicación SaaS de Gestión de Cosechas Inteligentes
- **Tenant**: Organización o productor agrícola registrado que opera de forma aislada dentro de la plataforma compartida
- **Usuario**: Persona autenticada que pertenece a un Tenant y opera el Sistema
- **Parcela**: Unidad de terreno agrícola delimitada geográficamente, asociada a un Tenant
- **Cultivo**: Especie vegetal sembrada en una Parcela durante un ciclo productivo determinado
- **Dashboard**: Panel principal de monitoreo que presenta indicadores clave de las parcelas del Tenant
- **Alerta**: Notificación generada por el Sistema cuando una condición monitoreada supera un umbral definido
- **API_Climática**: Servicio externo que provee datos meteorológicos actuales y pronósticos
- **Dato_de_Suelo**: Registro de parámetros del suelo (pH, humedad, nutrientes) asociado a una Parcela
- **Ciclo_Productivo**: Período comprendido entre la siembra y la cosecha de un Cultivo en una Parcela
- **Recomendación_Agronómica**: Sugerencia generada por el Sistema sobre el momento óptimo de siembra o cosecha de un Cultivo, basada en datos climáticos, ubicación geográfica y características del Cultivo
- **Recordatorio_Agrícola**: Notificación programada de una tarea agrícola (riego, poda o fertilización) asociada a una Parcela o Cultivo de un Tenant
- **Hemisferio_Sur**: Región geográfica al sur del ecuador donde los ciclos estacionales y productivos están invertidos respecto al hemisferio norte
- **Servicio_Externo**: Proveedor o plataforma de terceros integrada al Sistema, incluyendo API climáticas, base de datos en la nube y plataforma de despliegue
- **Plan_Gratuito**: Modalidad de uso sin costo de un Servicio_Externo, sujeta a límites de uso definidos por el proveedor

## Requisitos

### Requisito 1: Autenticación y Gestión de Tenants

**Historia de Usuario:** Como productor agrícola, quiero registrarme y acceder de forma segura a mi cuenta, para que mis datos estén protegidos y aislados de otros productores.

#### Criterios de Aceptación

1. WHEN un Usuario envía credenciales válidas de inicio de sesión, THE Sistema SHALL autenticar al Usuario y generar un token de sesión en un máximo de 2 segundos.
2. WHEN un Usuario envía credenciales inválidas, THE Sistema SHALL rechazar el acceso y mostrar un mensaje de error descriptivo sin revelar información sensible.
3. THE Sistema SHALL asociar cada Usuario a exactamente un Tenant mediante un identificador tenant_id en cada operación de datos.
4. WHEN un nuevo productor completa el formulario de registro, THE Sistema SHALL crear un Tenant y un Usuario administrador asociado.
5. IF un token de sesión expira o es inválido, THEN THE Sistema SHALL redirigir al Usuario a la pantalla de inicio de sesión.
6. THE Sistema SHALL impedir que un Usuario acceda a datos de un Tenant diferente al suyo.

### Requisito 2: Gestión de Parcelas

**Historia de Usuario:** Como productor agrícola, quiero registrar y administrar mis parcelas, para que pueda organizar y monitorear cada unidad de terreno de forma independiente.

#### Criterios de Aceptación

1. WHEN un Usuario crea una nueva Parcela, THE Sistema SHALL almacenar el nombre, ubicación geográfica (latitud y longitud), superficie en hectáreas y el tenant_id del Usuario.
2. WHEN un Usuario solicita la lista de parcelas, THE Sistema SHALL mostrar únicamente las Parcelas asociadas al Tenant del Usuario.
3. WHEN un Usuario edita los datos de una Parcela, THE Sistema SHALL actualizar los campos modificados y registrar la fecha de última modificación.
4. WHEN un Usuario elimina una Parcela, THE Sistema SHALL marcar la Parcela como inactiva sin eliminar los datos históricos asociados.
5. THE Sistema SHALL validar que el nombre de la Parcela sea único dentro del mismo Tenant.
6. IF un Usuario intenta crear una Parcela sin completar los campos obligatorios (nombre, ubicación, superficie), THEN THE Sistema SHALL mostrar un mensaje indicando los campos faltantes.

### Requisito 3: Gestión de Cultivos

**Historia de Usuario:** Como productor agrícola, quiero registrar los cultivos en mis parcelas, para que pueda hacer seguimiento del ciclo productivo de cada especie sembrada.

#### Criterios de Aceptación

1. WHEN un Usuario registra un nuevo Cultivo, THE Sistema SHALL asociar el Cultivo a una Parcela existente del Tenant e incluir especie, variedad, fecha de siembra y fecha estimada de cosecha.
2. WHEN un Usuario consulta los cultivos de una Parcela, THE Sistema SHALL listar todos los Cultivos activos e históricos ordenados por fecha de siembra descendente.
3. WHEN un Usuario actualiza el estado de un Cultivo (activo, cosechado, perdido), THE Sistema SHALL registrar el cambio de estado con la fecha correspondiente.
4. THE Sistema SHALL permitir asociar múltiples Cultivos a una misma Parcela en diferentes Ciclos_Productivos.
5. IF un Usuario intenta registrar un Cultivo sin asociarlo a una Parcela válida del Tenant, THEN THE Sistema SHALL rechazar la operación y mostrar un mensaje de error.

### Requisito 4: Dashboard de Monitoreo

**Historia de Usuario:** Como productor agrícola, quiero visualizar un panel con el estado actual de mis parcelas y cultivos, para que pueda tomar decisiones informadas de forma rápida.

#### Criterios de Aceptación

1. WHEN un Usuario accede al Dashboard, THE Sistema SHALL mostrar un resumen con el número total de Parcelas activas, Cultivos en curso y Alertas pendientes del Tenant.
2. WHEN un Usuario accede al Dashboard, THE Sistema SHALL presentar los datos climáticos actuales (temperatura, humedad relativa, probabilidad de precipitación) obtenidos de la API_Climática para la ubicación de cada Parcela.
3. THE Sistema SHALL renderizar el Dashboard en un tiempo máximo de 3 segundos en conexiones de 3G.
4. WHEN un Usuario selecciona una Parcela en el Dashboard, THE Sistema SHALL mostrar el detalle de los Cultivos activos y los últimos Datos_de_Suelo registrados para esa Parcela.
5. THE Sistema SHALL adaptar la disposición del Dashboard a pantallas móviles con un ancho mínimo de 320 píxeles.

### Requisito 5: Integración con Datos Climáticos

**Historia de Usuario:** Como productor agrícola, quiero ver información meteorológica actualizada de mis parcelas, para que pueda anticipar condiciones adversas y planificar actividades.

#### Criterios de Aceptación

1. THE Sistema SHALL consultar la API_Climática al menos cada 60 minutos para obtener datos meteorológicos actualizados por ubicación de Parcela.
2. WHEN la API_Climática responde con datos válidos, THE Sistema SHALL almacenar temperatura, humedad relativa, velocidad del viento, probabilidad de precipitación y pronóstico a 72 horas.
3. IF la API_Climática no responde o retorna un error, THEN THE Sistema SHALL mostrar los últimos datos climáticos disponibles junto con la fecha y hora de la última actualización exitosa.
4. WHEN un Usuario consulta datos climáticos de una Parcela, THE Sistema SHALL presentar los datos en unidades del sistema métrico (°C, km/h, mm, %).
5. THE Sistema SHALL asociar los datos climáticos a la ubicación geográfica (latitud y longitud) de cada Parcela del Tenant.

### Requisito 6: Gestión de Datos de Suelo

**Historia de Usuario:** Como productor agrícola, quiero registrar y consultar los parámetros de suelo de mis parcelas, para que pueda evaluar las condiciones del terreno a lo largo del tiempo.

#### Criterios de Aceptación

1. WHEN un Usuario registra un Dato_de_Suelo, THE Sistema SHALL almacenar la Parcela asociada, fecha de medición, pH, porcentaje de humedad, y opcionalmente niveles de nitrógeno, fósforo y potasio.
2. WHEN un Usuario consulta el historial de suelo de una Parcela, THE Sistema SHALL mostrar los registros ordenados por fecha de medición descendente.
3. THE Sistema SHALL validar que el valor de pH esté entre 0 y 14, y que el porcentaje de humedad esté entre 0 y 100.
4. IF un Usuario ingresa un valor de Dato_de_Suelo fuera de los rangos válidos, THEN THE Sistema SHALL rechazar el registro y mostrar un mensaje indicando el rango permitido.
5. WHEN un Usuario consulta datos de suelo, THE Sistema SHALL mostrar únicamente los registros pertenecientes al Tenant del Usuario.

### Requisito 7: Sistema de Alertas Básicas

**Historia de Usuario:** Como productor agrícola, quiero recibir alertas cuando las condiciones climáticas o de suelo superen umbrales críticos, para que pueda actuar a tiempo y proteger mis cultivos.

#### Criterios de Aceptación

1. WHEN un dato climático o de suelo supera un umbral configurado, THE Sistema SHALL generar una Alerta asociada a la Parcela correspondiente.
2. THE Sistema SHALL proveer umbrales predeterminados para temperatura mínima (0°C), temperatura máxima (40°C), humedad de suelo mínima (20%) y probabilidad de precipitación mayor a 80%.
3. WHEN un Usuario configura umbrales personalizados para una Parcela, THE Sistema SHALL utilizar los umbrales personalizados en lugar de los predeterminados para esa Parcela.
4. WHEN se genera una Alerta, THE Sistema SHALL mostrar la Alerta en el Dashboard del Usuario con tipo de alerta, Parcela afectada, valor detectado y fecha de generación.
5. WHEN un Usuario marca una Alerta como leída, THE Sistema SHALL actualizar el estado de la Alerta y dejar de contabilizarla como pendiente.
6. IF se generan múltiples Alertas del mismo tipo para la misma Parcela dentro de un período de 60 minutos, THEN THE Sistema SHALL agrupar las Alertas en una sola notificación consolidada.

### Requisito 8: Interfaz Responsiva Mobile-First

**Historia de Usuario:** Como productor agrícola que trabaja en campo, quiero acceder al sistema desde mi teléfono móvil con una experiencia fluida, para que pueda consultar información sin depender de un computador.

#### Criterios de Aceptación

1. THE Sistema SHALL diseñar todos los componentes de interfaz con un enfoque mobile-first, priorizando la experiencia en pantallas de 320 a 768 píxeles de ancho.
2. THE Sistema SHALL adaptar la navegación principal a un menú colapsable en dispositivos con ancho de pantalla menor a 768 píxeles.
3. THE Sistema SHALL permitir la interacción táctil con elementos de interfaz que tengan un área mínima de toque de 44x44 píxeles.
4. WHEN un Usuario accede al Sistema desde un dispositivo móvil con conexión lenta (3G), THE Sistema SHALL cargar la vista principal en un máximo de 5 segundos.
5. THE Sistema SHALL mantener la legibilidad del texto con un tamaño mínimo de fuente de 16 píxeles en dispositivos móviles.
6. THE Sistema SHALL soportar los navegadores móviles Chrome (últimas 2 versiones) y Safari (últimas 2 versiones) en iOS y Android.

### Requisito 9: Aislamiento Multi-Tenant

**Historia de Usuario:** Como productor agrícola, quiero que mis datos estén completamente aislados de otros productores en la plataforma, para que mi información sea confidencial y segura.

#### Criterios de Aceptación

1. THE Sistema SHALL incluir el campo tenant_id en todas las tablas de la base de datos que almacenen datos de negocio.
2. THE Sistema SHALL filtrar automáticamente todas las consultas de datos por el tenant_id del Usuario autenticado.
3. IF una operación de lectura o escritura no incluye un tenant_id válido, THEN THE Sistema SHALL rechazar la operación y registrar el evento como incidente de seguridad.
4. THE Sistema SHALL impedir la modificación del tenant_id en registros existentes.
5. WHEN un Usuario realiza cualquier operación CRUD, THE Sistema SHALL verificar que el recurso objetivo pertenezca al Tenant del Usuario antes de ejecutar la operación.

### Requisito 10: Recomendaciones Agronómicas en Tiempo Real

**Historia de Usuario:** Como productor agrícola del hemisferio sur, quiero recibir recomendaciones sobre el mejor momento para sembrar y cosechar mis cultivos, para que pueda optimizar el rendimiento basándome en datos climáticos actuales y características de cada parcela.

#### Criterios de Aceptación

1. WHEN un Usuario consulta una Recomendación_Agronómica para una Parcela, THE Sistema SHALL generar la recomendación combinando los datos climáticos vigentes obtenidos de la API_Climática, la latitud y longitud de la Parcela, y la especie y variedad del Cultivo asociado.
2. THE Sistema SHALL ajustar todas las Recomendaciones_Agronómicas considerando los ciclos productivos del Hemisferio_Sur, invertidos respecto al hemisferio norte.
3. WHEN un Usuario solicita una recomendación de siembra, THE Sistema SHALL retornar el rango de fechas óptimo de siembra calculado a partir de la especie del Cultivo, la ubicación geográfica de la Parcela y las condiciones climáticas vigentes.
4. WHEN un Usuario solicita una recomendación de cosecha, THE Sistema SHALL retornar la fecha estimada de cosecha calculada a partir de la fecha de siembra del Cultivo, la especie y variedad, y las condiciones climáticas registradas durante el Ciclo_Productivo.
5. IF la API_Climática no responde al solicitar una Recomendación_Agronómica, THEN THE Sistema SHALL retornar la última recomendación generada junto con la fecha y hora de los datos climáticos utilizados.
6. THE Sistema SHALL refrescar las Recomendaciones_Agronómicas al menos una vez cada 24 horas para incorporar nuevos datos climáticos.
7. IF la especie o variedad del Cultivo no cuenta con parámetros agronómicos definidos en el Sistema, THEN THE Sistema SHALL informar al Usuario que no es posible generar una recomendación específica para ese Cultivo.
8. THE Sistema SHALL mostrar únicamente Recomendaciones_Agronómicas asociadas a Parcelas y Cultivos del Tenant del Usuario autenticado.

### Requisito 11: Sistema de Recordatorios de Tareas Agrícolas

**Historia de Usuario:** Como productor agrícola, quiero programar y recibir recordatorios de tareas agrícolas como riego, poda y fertilización, para que pueda ejecutar las labores en el momento adecuado del ciclo productivo.

#### Criterios de Aceptación

1. WHEN un Usuario crea un Recordatorio_Agrícola, THE Sistema SHALL almacenar el tipo de tarea (riego, poda o fertilización), la Parcela asociada, el Cultivo asociado, la fecha y hora programada, y el tenant_id del Usuario.
2. WHEN el Sistema genera un Recordatorio_Agrícola de riego, THE Sistema SHALL calcular la fecha sugerida combinando el último Dato_de_Suelo con humedad medida y el pronóstico de precipitación a 72 horas obtenido de la API_Climática.
3. WHEN el Sistema genera un Recordatorio_Agrícola de poda, THE Sistema SHALL determinar la fecha sugerida según la fase del Ciclo_Productivo del Cultivo asociado.
4. WHEN el Sistema genera un Recordatorio_Agrícola de fertilización, THE Sistema SHALL determinar la fecha sugerida combinando el calendario de fertilización del Cultivo y los últimos Datos_de_Suelo registrados para la Parcela.
5. WHEN un Usuario accede al Dashboard, THE Sistema SHALL mostrar los Recordatorios_Agrícolas pendientes del Tenant ordenados por fecha programada ascendente.
6. WHEN un Usuario marca un Recordatorio_Agrícola como completado, THE Sistema SHALL actualizar el estado del Recordatorio_Agrícola a "completado" y registrar la fecha y hora de completado.
7. WHILE un Recordatorio_Agrícola tenga estado "completado", THE Sistema SHALL excluir el Recordatorio_Agrícola del listado de pendientes en el Dashboard.
8. WHEN la fecha programada de un Recordatorio_Agrícola se aproxima en menos de 24 horas, THE Sistema SHALL marcar el Recordatorio_Agrícola como "próximo" y destacarlo visualmente en el Dashboard.
9. IF un Usuario intenta crear un Recordatorio_Agrícola para una Parcela o Cultivo que no pertenece al Tenant del Usuario, THEN THE Sistema SHALL rechazar la operación.
10. THE Sistema SHALL mostrar a cada Usuario únicamente los Recordatorios_Agrícolas pertenecientes a su Tenant.

### Requisito 12: Restricción de Planes Gratuitos para Servicios Externos

**Historia de Usuario:** Como administrador de la plataforma, quiero que el Sistema utilice únicamente planes gratuitos de servicios externos, para que el costo operativo del MVP sea cero.

#### Criterios de Aceptación

1. THE Sistema SHALL utilizar Open-Meteo como API_Climática predeterminada por ofrecer un Plan_Gratuito sin requerir clave de API.
2. WHERE el operador configure una API_Climática alternativa, THE Sistema SHALL aceptar únicamente proveedores que ofrezcan un Plan_Gratuito documentado (por ejemplo, OpenWeatherMap free tier).
3. THE Sistema SHALL desplegarse en Vercel utilizando el Plan_Gratuito de la plataforma.
4. THE Sistema SHALL persistir los datos en Supabase utilizando el Plan_Gratuito del proveedor.
5. THE Sistema SHALL documentar en el archivo de configuración del proyecto los límites del Plan_Gratuito de cada Servicio_Externo integrado (cuotas de uso, número máximo de solicitudes y volumen de datos).
6. IF un Servicio_Externo configurado supera los límites de su Plan_Gratuito, THEN THE Sistema SHALL registrar un evento de advertencia en el log de operación y notificar al administrador del Tenant.
7. IF un nuevo Servicio_Externo propuesto no ofrece un Plan_Gratuito, THEN THE Sistema SHALL rechazar la integración del Servicio_Externo durante la configuración.
