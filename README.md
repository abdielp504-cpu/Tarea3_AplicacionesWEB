# Aplicación del clima

Aplicación web sencilla para consultar el clima actual y el pronóstico de los próximos siete días de una ciudad.


## API utilizada

[Open-Meteo](https://open-meteo.com) ofrece los datos meteorológicos sin necesidad de una API key.

- [Documentación de la API de pronóstico](https://open-meteo.com/en/docs)
- [Documentación de la API de geocodificación](https://open-meteo.com/en/docs/geocoding-api)

La aplicación busca primero la ciudad para obtener sus coordenadas y después consulta sus condiciones actuales y el pronóstico diario.

## Funcionalidades

- Búsqueda de ciudades y obtención de sus coordenadas.
- Consulta de temperatura, humedad, viento y estado actual del clima.
- Pronóstico de siete días con el día de la semana, un emoji y temperaturas máximas y mínimas.
- Sugerencias de ciudades al escribir y opción para consultar el clima de tu ubicación actual.
- Alternancia entre tema claro y oscuro.
- Indicadores de carga y mensajes para errores de conexión, servicios HTTP y ciudades no encontradas.
- Diseño adaptable a pantallas móviles y de escritorio.

## Cómo ejecutar

No requiere instalación de dependencias ni una API key.

1. Clona el repositorio:

   ```bash
   git clone https://github.com/abdielp504-cpu/Tarea3_AplicacionesWEB.git
   ```

2. Abre la carpeta del proyecto y luego abre `index.html` en un navegador.

También puedes abrir la carpeta del proyecto en Visual Studio Code y usar la extensión **Live Server** para iniciar la aplicación.

Para usar la ubicación actual, abre la aplicación desde `localhost` o una conexión HTTPS y concede permiso al navegador.

## Tecnologías

- HTML5
- CSS3
- JavaScript puro (ES6+, `fetch` y `async/await`)
- API de Open-Meteo

## Manejo de errores

| Situación | Mensaje mostrado |
| --- | --- |
| Campo de ciudad vacío | Escribe el nombre de una ciudad |
| El navegador indica que no hay conexión o `fetch` falla con un `TypeError` | Sin conexión a internet. Revisa tu red e inténtalo de nuevo |
| Geocodificación sin resultados | No se encontró la ciudad «nombre de la ciudad» |
| La API responde con HTTP 429 | Demasiadas peticiones. Espera un momento e inténtalo de nuevo |
| Otro error HTTP | El servicio no está disponible (error CÓDIGO). Inténtalo más tarde |
| La respuesta no contiene clima actual o diario | No hay datos del clima disponibles. |

Al ocurrir un error, se ocultan las tarjetas anteriores. El botón de búsqueda se vuelve a habilitar al terminar la solicitud.

## Estructura de archivos

```text
.
├── app.js       # Búsqueda, solicitudes a Open-Meteo y renderizado de resultados
├── index.html   # Estructura de la aplicación
├── README.md    # Documentación del proyecto
└── style.css    # Estilos y diseño adaptable
```

## Declaración de uso de herramientas de IA

En este proyecto utilicé las siguientes herramientas de IA:

| Herramienta | Uso |
|---|---|
| Claude (Anthropic) | Planeación del proyecto, elección de la API (Open-Meteo), plan de commits y redacción de prompts. |
| GitHub Copilot (Agent mode, VS Code) | Generación de código base en `style.css` y `app.js`, y borrador de este README. |
| Gemini (Google) | Apoyo con ideas, errores en la terminal, investigacion de la API. |

**Qué hice yo:** creé el repositorio, estructuré el proyecto, investigue la API, revisé errores y probé el código generado, realicé los commits e integré y ajusté el diseño, la búsqueda y las funciones de clima.