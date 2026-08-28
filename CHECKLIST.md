# ✅ Checklist de instalación

Marca cada paso conforme lo hagas. El orden importa.

---

## 🔑 PASO 1 — Llave para los poemas  · 3 min · **GRATIS**

Elige **una** de las dos. Empieza por la gratis.

### Opción A — Gemini (gratis, sin tarjeta) ← recomendada

- [ ] Entrar a <https://aistudio.google.com/apikey>
- [ ] **Create API key** → nombre: `poema-diario`
- [ ] Copiarla (empieza con `AIza`)

> **No pide tarjeta ni activar facturación.** Aquello de los 800 pesos era solo
> para generar video con Veo; el nivel gratuito de texto no lo necesita.
>
> ⚠️ En el nivel gratuito Google usa lo que envías para entrenar sus modelos.
> Aquí solo mandamos peticiones de poemas, así que no importa — pero no uses
> esa misma llave para datos confidenciales de tu trabajo.

### Opción B — Claude (de pago, mejor calidad literaria)

- [ ] Entrar a <https://console.anthropic.com> → **Get API Keys** → **Create Key**
- [ ] Copiarla (empieza con `sk-ant-`) — **solo se muestra una vez**
- [ ] En **Billing**, agregar saldo

> El consumo real es de **$0.19 USD al mes** (unos 3.5 pesos). Lo que define
> el desembolso es la recarga mínima, no el uso: un solo crédito dura años.
> Ojo: la API se paga aparte de tu suscripción de Claude, son cuentas distintas.

---

## 📱 PASO 2 — Upload-Post (para publicar en TikTok)  · 10 min · $16 USD/mes

- [ ] Crear cuenta en <https://www.upload-post.com>
- [ ] Contratar el plan **Basic ($16/mes)** — es el más barato que incluye TikTok
- [ ] En **Settings → API Keys**, copiar la llave
- [ ] Decidir un nombre de perfil, por ejemplo `poemas-abel`

---

## 💻 PASO 3 — Probar en tu computadora  · 10 min

- [ ] Descomprimir `poema-diario-tiktok.zip`
- [ ] Verificar que tienes lo necesario:
      ```
      node --version     (v20 o superior)
      ffmpeg -version
      git --version
      ```
      Si falta ffmpeg en Windows:  `winget install Gyan.FFmpeg`
      **Cierra y vuelve a abrir la terminal después de instalarlo.**

- [ ] Crear el archivo de llaves:
      ```
      copy .env.example .env
      ```
- [ ] Abrir `.env` y pegar las dos llaves y el nombre de perfil

- [ ] Conectar tu cuenta de TikTok:
      ```
      node -e "import('./src/publicar.js').then(m=>m.linkDeConexion())"
      ```
      Te imprime un link. Ábrelo, inicia sesión en TikTok y autoriza.

- [ ] Generar un video de prueba **sin publicar**:
      ```
      npm run prueba
      ```
      Revisa el resultado en la carpeta `salidas/`

---

## ☁️ PASO 4 — Automatizar en la nube  · 10 min · gratis

- [ ] Crear un repositorio nuevo en <https://github.com/new>, nombre `poema-diario-tiktok`
- [ ] Subir el proyecto:
      ```
      git init
      git add .
      git commit -m "Poema del dia"
      git branch -M main
      git remote add origin https://github.com/TU-USUARIO/poema-diario-tiktok.git
      git push -u origin main
      ```
- [ ] ⚠️ **Verificar que NO se subió el archivo `.env`** (ahí están tus llaves)

- [ ] En el repo: **Settings → Secrets and variables → Actions → New repository secret**
      Crear los tres:

      | Nombre | Valor |
      |---|---|
      | `GEMINI_API_KEY` | tu llave AIza... (opción gratis) |
      | `ANTHROPIC_API_KEY` | tu llave sk-ant-... (opción de pago) |
      | `UPLOADPOST_API_KEY` | tu llave de Upload-Post |
      | `UPLOADPOST_USER` | el nombre de perfil |

- [ ] Pestaña **Actions** → **Poema del día → TikTok** → **Run workflow**
      Marca *solo probar* la primera vez
- [ ] Descargar el video desde **Artifacts** al final de la ejecución y revisarlo
- [ ] Si todo se ve bien, correrlo otra vez **sin** marcar *solo probar*

---

## 🎬 PASO 5 — Cambiar el clip por el de Veo definitivo  · cuando se restablezca tu cuota

- [ ] Generar en Gemini con el prompt de `PROMPT-GEMINI-v2.md`
- [ ] Descargar el mp4 y dejarlo en la carpeta `Tiktok Diseño`
- [ ] Instalarlo:
      ```
      bash scripts/integrar-clip.sh "ruta/del/video.mp4"
      npm run prueba
      ```
- [ ] Subir el cambio:
      ```
      git add assets/libro_master.mp4
      git commit -m "Nuevo clip maestro"
      git push
      ```

> El clip actual ya funciona. Este paso solo lo mejora — no bloquea nada.

---

## 🎵 OPCIONAL — Música de fondo

- [ ] Poner cualquier mp3 libre de derechos en `assets/audio/fondo.mp3`
- [ ] O generarla con IA: `npm run musica` (requiere llave de ElevenLabs)

El render la detecta sola y la mezcla con desvanecido de entrada y salida.

---

## 🧯 Si algo falla

Todo está en la sección **"Si algo falla"** del `README.md`.
