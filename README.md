# 3.4 Web app para automatización IA

Aplicación web académica estática que permite consultar un asistente de tecnologías de la información. El usuario elige un tema, nivel y mecanismo de integración, escribe una pregunta y recibe en la página la respuesta generada por el flujo de n8n, sin recargarla.

La aplicación no llama a OpenAI directamente desde el navegador y no requiere un backend propio ni un paso de compilación.

## Arquitectura

```text
GitHub Pages
    -> Fetch POST (application/json)
    -> Webhook de producción de n8n
    -> Switch según integracion (nativo o http)
       -> Nodo OpenAI nativo
       -> HTTP Request a Responses API
    -> respuesta JSON unificada
    -> interfaz web
```

El cliente envía `tema`, `nivel`, `pregunta` e `integracion`. La rama nativa y la rama HTTP del workflow deben normalizar su salida para que ambas devuelvan el mismo contrato:

```json
{
  "ok": true,
  "respuesta": "Texto de respuesta",
  "tema": "Redes",
  "nivel": "Intermedio",
  "integracion": "nativo"
}
```

`ok` debe ser booleano y `respuesta`, `tema`, `nivel` e `integracion` deben ser cadenas. En caso de error lógico, n8n puede devolver `ok: false` y un mensaje en `respuesta`. El cliente también maneja errores HTTP, JSON inválido, problemas de red y tiempo de espera.

## Tecnologías

- HTML5 semántico y CSS3.
- Bootstrap 5.3.3 desde CDN y estilos propios en `css/styles.css`.
- JavaScript ES Modules, Fetch API, `async`/`await` y `AbortController`.
- Git y GitHub Pages para control de versiones y publicación estática.

No se usan frameworks de compilación, jQuery, base de datos ni funciones serverless.

## Estructura

```text
.
├── index.html
├── README.md
├── assets/                 # Vacío actualmente
├── css/
│   └── styles.css
└── js/
    ├── api.js
    ├── config.js
    ├── main.js
    ├── ui.js
    └── validation.js
```

`index.html` ya referencia `assets/favicon.svg`, pero ese archivo todavía debe agregarse. Actualmente tampoco hay un `.gitignore`; ambos elementos quedan pendientes y no son necesarios para servir los archivos estáticos.

### Responsabilidad de los módulos

- `js/config.js`: exporta la URL HTTPS pública de producción del Webhook.
- `js/validation.js`: valida opciones y normaliza la pregunta a un máximo de 500 caracteres.
- `js/api.js`: envía el POST JSON, aplica un timeout y comprueba el contrato de respuesta.
- `js/ui.js`: presenta carga, errores, errores de campo y resultado como texto seguro.
- `js/main.js`: conecta el formulario con la validación, la API y la interfaz.

## Configuración y seguridad

La URL de producción se configura en `js/config.js`, mediante `WEBHOOK_URL`. Esa dirección es pública y cualquiera puede verla en el código fuente del sitio; no es una contraseña.

Las credenciales de OpenAI deben permanecer exclusivamente en Credentials de n8n. No agregues claves, tokens ni encabezados de autorización al HTML, CSS, JavaScript, repositorio o GitHub Pages.

CORS no es un mecanismo de autenticación. La solicitud JSON puede generar una prevalidación `OPTIONS`; n8n debe permitir el origen del sitio publicado, el método `POST` y el encabezado `Content-Type`, y responder con los encabezados CORS necesarios. Si la prevalidación falla, el navegador no enviará o no permitirá leer la solicitud y el problema debe corregirse en la configuración del Webhook. No uses `mode: "no-cors"`: impide leer la respuesta. Si se decide usar `application/x-www-form-urlencoded`, el cliente y el workflow deben adaptarse juntos y n8n debe normalizar los mismos cuatro campos.

Como cualquier persona puede invocar un Webhook público, valida entradas y limita consumo y frecuencia en n8n. Conserva el máximo de 500 caracteres, evita enviar preguntas con información personal sensible y despublica o desactiva el Webhook al terminar la evaluación si ya no se necesita.

## Uso local

1. Abre la carpeta del proyecto en Visual Studio Code.
2. Desde una terminal situada en la raíz del proyecto, inicia un servidor estático compatible con módulos ES:

   ```bash
   python -m http.server 8000
   ```

   También puedes usar una extensión de servidor local de VS Code. No abras `index.html` directamente con `file://`, porque los módulos ES requieren un origen HTTP.
3. Abre `http://localhost:8000` en el navegador.
4. Abre las herramientas de desarrollador y revisa las pestañas **Console** y **Network** al probar. Detén el servidor con `Ctrl+C`.

El uso local sigue llamando al Webhook público configurado; no es una simulación. La prueba requiere que el workflow de producción esté activo y que n8n permita el origen local mediante CORS.

## Pruebas previstas

Estas pruebas están pendientes; no se afirma que la comunicación desde el navegador o la publicación ya se hayan verificado.

1. Enviar el formulario vacío y comprobar que aparecen errores junto a los cuatro campos, sin POST.
2. Probar preguntas con menos de 10 y más de 500 caracteres, y comprobar la normalización de espacios.
3. Seleccionar **Nodo OpenAI** (`nativo`), enviar una pregunta no sensible y comprobar en **Network** el POST JSON con exactamente `tema`, `nivel`, `pregunta` e `integracion`. Confirmar que n8n toma la rama nativa y devuelve el contrato JSON acordado.
4. Repetir con **HTTP Request / Responses API** (`http`) y confirmar que n8n toma la rama HTTP y devuelve el mismo contrato.
5. Verificar que la respuesta se presenta sin recargar la página, que los saltos de línea se conservan y que el contenido se muestra como texto, no como HTML.
6. Comprobar el botón de limpiar, el estado de carga y que no se envíen solicitudes duplicadas.
7. Probar errores HTTP, respuesta no JSON, respuesta con estructura incorrecta, fallo de red/CORS y timeout; confirmar que se informa el problema y se conservan los datos para reintentar.

Para diagnosticar CORS, revisa **Network**: con JSON debe aparecer una solicitud `OPTIONS` antes del `POST`. Si la prevalidación falla, revisa la respuesta CORS del Webhook en n8n; un error CORS no se corrige desde el frontend.

## Publicación en GitHub Pages

1. Crea un repositorio en GitHub y sube el contenido del proyecto a la rama `main`.
2. En el repositorio, abre **Settings > Pages**.
3. En **Build and deployment**, selecciona **Deploy from a branch**.
4. Elige la rama `main` y la carpeta `/(root)`, y guarda los cambios.
5. Espera a que termine el despliegue y abre la URL HTTPS que GitHub Pages indique, normalmente `https://<usuario>.github.io/<repositorio>/`.
6. Repite las pruebas previstas desde esa URL. Configura CORS en n8n para permitir el origen publicado exacto y verifica que las rutas relativas de los módulos carguen bajo la subruta del repositorio.

La publicación y las pruebas desde GitHub Pages aún están pendientes. El proyecto solo debe considerarse verificado cuando ambas integraciones respondan correctamente desde el sitio publicado.