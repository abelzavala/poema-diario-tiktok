# MASTERPLAN: Poema del Día

> Documento de proyecto (PRD) · Claude Code Workshop
> Autor: Abel · Creado: 28 de agosto de 2026

---

## Descripción

**Poema del Día** es una automatización que publica en TikTok, todos los días a las 9:00 AM,
un video vertical de un libro antiguo que se abre bajo un haz de luz mientras aparece en
sus páginas un poema original acompañado de la fecha del día.

**El problema que resuelve:** publicar contenido diario en TikTok exige constancia — hay que
tener una idea, producir el video, escribir el texto y subirlo, todos los días sin fallar. La
mayoría de las cuentas mueren por eso, no por falta de talento. Este proyecto elimina el
trabajo manual por completo: el contenido se produce y se publica solo, sin que yo tenga que
abrir la computadora.

**Qué hace exactamente:** cada mañana un servidor en la nube pide un poema original a un
modelo de lenguaje, lo compone tipográficamente sobre un video base ya producido, le agrega
la fecha y la música, y lo publica en TikTok mediante una API. Todo el ciclo dura menos de
un minuto y no requiere ninguna intervención humana.

---

## Usuario Ideal

**Usuario final (quien ve el contenido en TikTok)**
- Perfil: personas de 20 a 45 años que consumen contenido de reflexión, motivación y poesía
  en redes sociales, principalmente en México y Latinoamérica.
- Contexto de consumo: scroll matutino o nocturno, con el teléfono en vertical, muchas veces
  sin sonido.
- Problema principal: buscan un momento breve de calma o de impulso dentro de un feed que en
  general es ruidoso y acelerado.
- Qué esperan: algo bello, corto y que se pueda guardar o compartir.

**Operador (yo)**
- Perfil: no soy editor de video ni community manager, y no quiero serlo.
- Problema principal: quiero presencia constante en TikTok sin dedicarle tiempo diario.
- Qué necesito: que funcione solo, que no se caiga en silencio, y que si algo falla me entere.

---

## Funcionalidades MVP

1. **Generación automática de poemas.** Llamada diaria a un modelo de lenguaje que devuelve
   un poema original de 4 versos en español, con restricción de longitud por verso para que
   siempre quepa en pantalla.
2. **Historial anti-repetición.** Registro persistente de los poemas y temas ya publicados,
   que se envía al modelo como contexto para que no repita ideas ni imágenes.
3. **Composición de video.** Superposición tipográfica del poema y la fecha del día sobre un
   clip maestro, con aparición escalonada verso por verso y salida limpia al final.
4. **Tamaño de letra adaptativo.** El motor mide el verso más largo y ajusta el tamaño de
   fuente para que nunca se corte el texto.
5. **Mezcla de audio.** Música de fondo con desvanecido de entrada y salida.
6. **Publicación automática en TikTok.** Subida por API con caption, hashtags rotativos y
   declaración de contenido generado con IA.
7. **Ejecución programada.** Disparo diario a las 9:00 AM hora de Ciudad de México, en la
   nube, sin depender de que mi computadora esté encendida.
8. **Modo de prueba.** Ejecución que genera el video pero no lo publica, para revisar antes
   de comprometerse.
9. **Reintentos y registro.** Manejo de fallos de red con reintentos escalonados y bitácora
   de cada ejecución.

### Fuera del MVP (posible más adelante)
- Publicación simultánea en Instagram Reels y YouTube Shorts
- Panel web para revisar y aprobar el poema antes de publicar
- Rotación entre varios clips maestros
- Métricas de rendimiento por poema para aprender qué temas funcionan mejor

---

## Flujo Principal

1. **09:00** — El programador de tareas en la nube dispara la ejecución.
2. El sistema lee el historial de poemas anteriores y elige un tema que no se haya usado
   recientemente.
3. Envía la petición al modelo de lenguaje y recibe el poema en formato estructurado.
4. Valida el resultado: número de versos, longitud, y que no venga vacío. Si falla, se detiene
   con un mensaje claro en vez de publicar algo roto.
5. Guarda el poema en el historial.
6. Compone el video: clip maestro + fecha + versos + firma + música.
7. Sube el video a TikTok con su caption y hashtags.
8. Consulta el estado de la publicación hasta confirmar que quedó publicada.
9. Archiva el video como artefacto descargable y registra el poema en el control de versiones.

**Si algo falla:** la ejecución se detiene, el error queda en la bitácora, y el video
generado hasta ese punto queda disponible para revisión o publicación manual.

---

## Arquitectura y Decisiones Técnicas

| Componente | Elección | Por qué |
|---|---|---|
| Lenguaje | Node.js 22, módulos ES | Es lo que ya trae el ecosistema del curso; sin dependencias externas |
| Generación de texto | API de Gemini (nivel gratuito) o API de Claude | Gemini no requiere tarjeta; Claude da mejor calidad literaria. Intercambiable por variable de entorno |
| Video base | Google Veo 3.1, generado una sola vez | Generarlo a diario costaría más, tardaría minutos y el look variaría |
| Composición | ffmpeg con filtros `drawtext` | Control total, sin costo, reproducible, corre igual en Windows y en la nube |
| Publicación | Upload-Post | La API oficial de TikTok exige un audit de semanas durante el cual todos los posts quedan privados de forma permanente |
| Ejecución programada | GitHub Actions | Gratis, en la nube, con bitácora por ejecución y ejecución manual desde el navegador |
| Secretos | Variables de entorno + GitHub Secrets | Las llaves nunca viven en el código ni en el repositorio |

### Decisión de diseño clave
El video del libro **no se genera cada día**. Se produce una sola vez y se reutiliza; lo único
que cambia diariamente es el texto superpuesto. Esto reduce el costo diario a cero, elimina el
tiempo de espera, garantiza consistencia visual entre publicaciones y quita un punto de fallo
de la cadena.

---

## Referencias Visuales

- **Imagen base del proyecto:** libro abierto sobre fondo negro con un haz de luz cenital,
  tonos ámbar y crema. Es la referencia que se usó para generar el clip maestro.
- **Tipografía:** Cormorant Garamond — serif de trazo fino y contraste alto, elegante y
  legible en pantalla pequeña.
- **Paleta:**
  - Fondo: negro profundo
  - Página: crema envejecido
  - Texto del poema: crema claro con borde oscuro sutil
  - Fecha y ornamento: dorado tenue
- **Referencia de ritmo:** cuentas de poesía en TikTok donde el texto aparece verso por verso
  en lugar de todo de golpe. Genera pausa y hace que el espectador se quede hasta el final.

---

## Restricciones y Riesgos

| Riesgo | Mitigación |
|---|---|
| TikTok penaliza contenido IA sin declarar | El sistema envía `is_aigc=true` en cada publicación |
| Derechos de autor de los poemas | Se generan originales con IA; no se usan poetas vivos |
| Derechos de la música | Música con licencia comercial explícita o generada con IA |
| Dependencia de un intermediario (Upload-Post) | El módulo de publicación está desacoplado: cambiar de proveedor toca un solo archivo |
| GitHub apaga crons en repos inactivos 60 días | Cada ejecución hace un commit del historial, lo que mantiene el repo activo |
| El modelo devuelve un poema mal formado | Validación estricta antes de renderizar; si falla, no publica |
| Fuga de llaves | `.env` en `.gitignore`, secretos en GitHub Secrets |

---

## Presupuesto Mensual

| Concepto | Costo |
|---|---|
| GitHub Actions | $0 |
| Generación de poemas (Gemini nivel gratuito) | $0 |
| Video base (Veo, una sola vez) | ya cubierto |
| Música (una sola vez) | $0 |
| Upload-Post plan Basic | $16 USD |
| **Total recurrente** | **$16 USD/mes** |

---

## Criterio de Éxito

**Técnico:** que durante 14 días seguidos se publique un video a las 9:00 AM sin que yo
intervenga y sin errores en la bitácora.

**De producto:** que los videos se vean lo bastante bien como para que yo mismo los
compartiría, y que empiecen a acumular guardados — que es la señal de que el contenido
de reflexión está funcionando.
