# 🎬 Cómo generar el clip del libro en la app de Gemini

Esto se hace **una sola vez**. Al terminar tendrás un `.mp4` que el proyecto reutiliza todos los días.

---

## Paso 1 — Suscríbete a Google AI Plus

1. Entra a <https://gemini.google/mx/subscriptions/>
2. Elige **Google AI Plus — $99 MXN/mes** (incluye Veo 3.1)
3. Se paga como cualquier cosa de Google Play. **No pide cuenta de Google Cloud ni retención.**

> 💡 Cuando termines de generar los clips, puedes cancelar la suscripción el mismo día. Sigues teniendo acceso hasta que termine el mes pagado.

---

## Paso 2 — Genera el video

1. Entra a <https://gemini.google.com>
2. En el selector de herramientas, elige **Video** (o busca "Veo")
3. **Sube la imagen del libro** — está en tu carpeta: `poema-diario-tiktok/assets/libro_referencia.png`
   (si descomprimiste el zip; si no, usa la misma imagen que me mandaste)
4. Configura **formato vertical 9:16**
5. Pega este prompt:

```
Cinematic vertical shot, pitch black background. An old thick leather-bound book rests
closed on a dark wooden table, lit only by a single warm beam of light falling from above
like light through a cathedral window. The heavy cover slowly lifts and the book opens by
itself, pages fanning gently, dust motes drifting through the light beam. The camera pushes
in slowly and smoothly toward the open pages until the aged paper fills the frame. Warm
amber and cream tones against deep black. Volumetric god rays, shallow depth of field,
35mm film grain, no text visible on the pages, no people, no hands, no camera shake.
Slow, reverent, meditative pace.
```

6. Genera. Tarda 2–4 minutos.

---

## Paso 3 — Genera 3 o 4 versiones

**Hazlo.** El primer resultado casi nunca es el mejor y ya pagaste el mes. Dale a "generar" varias veces con el mismo prompt — cada intento sale distinto.

Si el resultado no te convence, prueba estas variantes del prompt:

**Si el libro se abre demasiado rápido:**
> …the heavy cover lifts *very slowly*, almost imperceptibly, over several seconds…

**Si la cámara se mueve mucho:**
> …locked-off static camera, extremely slow push-in, tripod shot, no handheld movement…

**Si sale texto raro o legible en las páginas:**
> …the pages are blank aged parchment, completely empty, no writing, no text, no symbols…

**Si quieres más dramatismo en la luz:**
> …a single hard shaft of golden light cuts through total darkness, heavy volumetric haze,
> strong chiaroscuro, everything else in deep black…

---

## Paso 4 — Descarga y entrégamelo

1. Descarga el mp4 de la versión que más te guste (o de varias, si quieres que comparemos)
2. Ponlo en tu carpeta **`Documents\Claude\Projects\Tiktok Diseño`**
3. Dime que ya está y yo lo integro, lo normalizo a 1080×1920 y te muestro el resultado final con el poema encima

Si prefieres hacerlo tú mismo:
```bash
bash scripts/integrar-clip.sh "C:/ruta/del/video_descargado.mp4"
npm run prueba
```

---

## ⚠️ Qué revisar antes de escoger

- **Que no aparezca texto legible en las páginas.** Estorba con el poema que va encima.
- **Que la página termine bien iluminada y centrada.** Ahí es donde cae el poema.
- **Que no haya manos ni personas.** Rompe la estética.
- **Que el movimiento sea lento.** Si es muy rápido no importa tanto: el script lo ralentiza al integrarlo.
