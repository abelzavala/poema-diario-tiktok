# 📖 Poema del día → TikTok

Cada mañana a las **9:00 AM (hora de CDMX)**, sin que toques nada:

1. **Claude escribe un poema original** de 4 versos (nunca se repite — lleva historial).
2. **ffmpeg lo compone** sobre el video del libro abriéndose, con la fecha del día y música de fondo.
3. **Se publica en TikTok** automáticamente.

Todo corre en **GitHub Actions** (en la nube, gratis). Tu computadora puede estar apagada.

---

## 💰 Cuánto cuesta al mes

| Concepto | Costo |
|---|---|
| GitHub Actions | **$0** (los repos públicos son gratis ilimitado) |
| Poema (Gemini gratis, o Claude a ~$0.19/mes) | **$0** |
| Video con IA | **$0** — se genera una sola vez (~$0.10 la primera vez) |
| Música | **$0** — se genera una sola vez |
| Upload-Post (publicar en TikTok) | **$16 USD/mes** |
| **Total** | **≈ $16 USD/mes** |

> ⚠️ **Ojo con el plan gratis de Upload-Post:** tiene 10 subidas/mes pero **TikTok no está incluido en el plan gratuito**. Para TikTok necesitas el plan Basic de $16/mes. Si quieres probar sin pagar, usa el modo `--dry-run` (genera el video y tú lo subes a mano desde el celular).

---

## 🚀 Instalación (30 minutos, una sola vez)

### Paso 1 — Requisitos en tu computadora

```bash
node --version    # necesitas v20 o superior
ffmpeg -version   # si no lo tienes: https://ffmpeg.org/download.html
git --version
```

En Windows, la forma más fácil de instalar ffmpeg:
```powershell
winget install Gyan.FFmpeg
```
Cierra y vuelve a abrir la terminal después de instalarlo.

### Paso 2 — Consigue las 2 llaves obligatorias

**A) El generador de poemas — elige UNA**

*Gratis (recomendado para empezar):* Gemini
1. Entra a <https://aistudio.google.com/apikey>
2. **Create API key** → nombre: `poema-diario`
3. Cópiala (empieza con `AIza`). Ponla en `.env` como `GEMINI_API_KEY`
4. **No pide tarjeta ni activar facturación.** El nivel gratuito de texto no lo requiere.

> ⚠️ En el nivel gratuito Google usa lo que envías para entrenar sus modelos y revisores
> humanos pueden leerlo. Aquí solo mandamos peticiones de poemas, así que no hay problema,
> pero no reutilices esa llave para datos confidenciales.

*De pago (mejor calidad literaria):* Claude
1. Entra a <https://console.anthropic.com> → **Get API Keys** → **Create Key**
2. Cópiala (empieza con `sk-ant-`). **Solo se muestra una vez.**
3. Agrega saldo en *Billing*. El consumo real es de **$0.19 USD al mes**, así que
   la recarga mínima te dura años.
4. Si pones esta llave, tiene prioridad sobre la de Gemini.

**B) Upload-Post (para publicar en TikTok)**
1. Entra a <https://www.upload-post.com> y crea tu cuenta.
2. Contrata el plan **Basic ($16/mes)** — es el más barato que incluye TikTok.
3. En **Settings → API Keys**, copia tu llave.

### Paso 3 — Configura el proyecto

```bash
cd poema-diario-tiktok
cp .env.example .env
```

Abre `.env` y pega tus dos llaves. Inventa un nombre para `UPLOADPOST_USER`, por ejemplo `poemas-abel`.

### Paso 4 — Conecta tu cuenta de TikTok

```bash
node -e "import('./src/publicar.js').then(m=>m.linkDeConexion())"
```

Te va a imprimir un link. **Ábrelo en tu navegador**, inicia sesión con la cuenta de TikTok donde quieres publicar y autoriza. Listo — esto se hace una sola vez.

### Paso 5 — Prueba que todo funciona

```bash
npm run prueba
```

Esto genera el video **sin publicarlo**. Ábrelo desde la carpeta `salidas/`. Si te gusta cómo se ve, ya estás.

---

## ☁️ Ponerlo en automático (GitHub Actions)

### 1. Sube el proyecto a GitHub

```bash
git init
git add .
git commit -m "Poema del día"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/poema-diario-tiktok.git
git push -u origin main
```

> ⚠️ Verifica que **NO** se subió el archivo `.env` (ya está en `.gitignore`, pero revísalo). Ahí están tus llaves.

### 2. Guarda las llaves como *secrets*

En tu repo de GitHub: **Settings → Secrets and variables → Actions → New repository secret**.

Crea estos tres, uno por uno:

| Nombre | Valor |
|---|---|
| `GEMINI_API_KEY` | tu llave `AIza...` (si usas la opción gratis) |
| `ANTHROPIC_API_KEY` | tu llave `sk-ant-...` (si usas la de pago) |
| `UPLOADPOST_API_KEY` | tu llave de Upload-Post |
| `UPLOADPOST_USER` | el nombre de perfil que inventaste |

### 3. Enciéndelo

Ve a la pestaña **Actions** de tu repo → **Poema del día → TikTok** → botón **Run workflow**.

Márcalo como *solo probar* la primera vez para ver el resultado sin publicar. El video queda descargable al final de la ejecución, en la sección *Artifacts*.

Si sale bien, **ya está**: mañana a las 9:00 AM se publica solo.

> **Nota sobre el horario:** el cron está en `0 15 * * *` (15:00 UTC = 9:00 AM en CDMX). GitHub a veces retrasa los crons entre 5 y 20 minutos cuando hay mucha carga — es normal y no es un error.

---

## 🎨 Personalización

### Cambiar el video del libro

El proyecto trae **dos formas** de crear el clip maestro:

**Opción A — sin IA, gratis (ya está hecho):**
```bash
npm run master:local
```
Toma `assets/libro_referencia.png` y le aplica un acercamiento cinematográfico con ffmpeg. Es el que está usando ahora mismo.

**Opción B — con IA (Google Veo 3.1), el libro se abre de verdad:**
```bash
# Consigue tu llave gratis en https://aistudio.google.com/apikey
# y ponla en .env como GEMINI_API_KEY
npm run master
```
Cuesta unos **$0.10 USD** y tarda 2-4 minutos. Genera 8 segundos en 1080×1920 donde el libro efectivamente se abre solo con el haz de luz. Se corre **una sola vez**.

¿Quieres varias versiones para que rote? `VARIANTES=5 npm run master` (≈$0.50 total).

### Cambiar los temas de los poemas

Edita la lista `TEMAS` en `src/poema.js`. También puedes ajustar el prompt completo ahí mismo (tono, número de versos, longitud).

### Cambiar tipografía, colores y posición del texto

Todo está en `src/render.js`, en la sección de filtros:
- `fs_poema` → tamaño de letra
- `0x2E2418` → color de la tinta del poema
- `0xD9C7A3` → color de la fecha
- `yInicio` → altura del bloque de versos
- `T_POEMA` / `PASO` → cuándo y qué tan rápido aparecen los versos

### Agregar música

```bash
npm run musica      # con IA (ElevenLabs)
```
o simplemente pon tu propio mp3 libre de derechos en `assets/audio/fondo.mp3`. El render lo detecta solo.

---

## 🧯 Si algo falla

| Síntoma | Qué hacer |
|---|---|
| `Falta la llave del generador de poemas` | No creaste el `.env` o está vacío. Copia `.env.example` a `.env` y pon al menos una llave. |
| Gemini responde `429` | Llegaste al límite del nivel gratuito. Espera unos minutos o cambia a `MODELO_GEMINI=gemini-2.5-flash-lite` |
| `No existe el clip maestro` | Corre `npm run master:local` |
| `ffmpeg: command not found` | Instala ffmpeg y **reinicia la terminal** |
| `Upload-Post respondió 401` | Llave mal copiada (fíjate en espacios al inicio o al final) |
| `Upload-Post respondió 403` | Tu plan no incluye TikTok — necesitas el Basic de $16 |
| El video sale sin poema | Claude devolvió algo raro. Revisa el log; el proyecto imprime lo que recibió. |
| El cron no dispara | GitHub deshabilita los crons de repos **sin actividad por 60 días**. Haz un commit cualquiera. |
| Texto cortado en pantalla | El poema salió muy largo. El tamaño se ajusta solo, pero puedes bajar el límite de caracteres en el prompt de `src/poema.js` |

---

## ⚖️ Cosas legales importantes

- **Declara el contenido IA.** El proyecto ya manda `is_aigc=true` a TikTok. No lo quites: TikTok exige etiquetar contenido generado con IA y puede penalizar cuentas que no lo hagan.
- **Los poemas son originales.** Se generan con IA, no se copian de poetas existentes. Si cambias a poemas de autores reales, verifica que estén en dominio público (en México y casi toda LatAm: 100 años después de la muerte del autor).
- **La música** debe ser libre de derechos o con licencia comercial. Si usas ElevenLabs Music, revisa <https://elevenlabs.io/music-terms> — los derechos dependen de tu plan.
- **La imagen de referencia** que usaste debe ser tuya o con licencia. Si la bajaste de internet, sustitúyela por una propia o genera el clip con Veo (Opción B).

---

## 📁 Estructura

```
poema-diario-tiktok/
├── .github/workflows/
│   └── poema-diario.yml      ← el cron de las 9am
├── assets/
│   ├── libro_master.mp4      ← el video base (se genera una vez)
│   ├── libro_referencia.png  ← imagen del libro
│   ├── fuentes/cormorant.ttf ← tipografía serif elegante
│   └── audio/fondo.mp3       ← música (opcional)
├── datos/
│   └── historial.json        ← poemas ya publicados (anti-repetición)
├── salidas/                  ← los videos generados
├── scripts/
│   ├── generar-master.js     ← video del libro con Veo 3.1
│   ├── master-fallback.sh    ← video del libro sin IA
│   └── generar-musica.js     ← música con ElevenLabs
└── src/
    ├── config.js             ← llaves, rutas, fecha
    ├── poema.js              ← genera el poema con Claude
    ├── render.js             ← compone el video con ffmpeg
    ├── publicar.js           ← sube a TikTok
    └── index.js              ← orquesta todo
```
