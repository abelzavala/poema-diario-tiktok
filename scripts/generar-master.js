/**
 * Genera el CLIP MAESTRO con Google Veo 3.1 (image-to-video) partiendo de
 * assets/libro_referencia.png. Se corre UNA SOLA VEZ (o cuando quieras
 * refrescar el look). Cuesta unos centavos de dólar por clip.
 *
 *   GEMINI_API_KEY=...  npm run master
 *
 * Variables opcionales:
 *   MODELO=veo-3.1-fast-generate-preview   (más barato)  | veo-3.1-generate-preview
 *   VARIANTES=3                            genera 3 clips maestros para rotar
 */
import fs from 'node:fs';
import path from 'node:path';
import { cfg, log, RAIZ } from '../src/config.js';

const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const MODELO = process.env.MODELO || 'veo-3.1-fast-generate-preview';
const VARIANTES = parseInt(process.env.VARIANTES || '1', 10);

const PROMPT = `Cinematic vertical shot, pitch black background. An old thick leather-bound book
rests closed on a dark wooden table, lit only by a single warm beam of light falling from above
like light through a cathedral window. The heavy cover slowly lifts and the book opens by itself,
pages fanning gently, dust motes drifting through the light beam. The camera pushes in slowly and
smoothly toward the open pages until the aged paper fills the frame. Warm amber and cream tones
against deep black. Volumetric god rays, shallow depth of field, 35mm film grain, no text visible
on the pages, no people, no hands. Slow, reverent, meditative pace.`;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function generarUno(indice) {
  const imagen = fs.readFileSync(cfg.rutas.referencia).toString('base64');

  log(`🎥 Pidiendo video a ${MODELO}…`);
  const inicio = await fetch(`${BASE}/models/${MODELO}:predictLongRunning`, {
    method: 'POST',
    headers: { 'x-goog-api-key': cfg.geminiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{
        prompt: PROMPT,
        image: { inlineData: { mimeType: 'image/png', data: imagen } },
      }],
      parameters: {
        aspectRatio: '9:16',
        resolution: '1080p',
        durationSeconds: '8',      // obligatorio "8" cuando se pide 1080p
        personGeneration: 'allow_adult',
        numberOfVideos: 1,
      },
    }),
  });

  if (!inicio.ok) throw new Error(`Veo rechazó la petición (${inicio.status}): ${await inicio.text()}`);
  const { name } = await inicio.json();
  log(`⏳ Operación creada: ${name}`);

  // Polling — Veo suele tardar entre 1 y 4 minutos
  let estado;
  for (let i = 0; i < 80; i++) {
    await sleep(10_000);
    const r = await fetch(`${BASE}/${name}`, { headers: { 'x-goog-api-key': cfg.geminiKey } });
    estado = await r.json();
    if (estado.done) break;
    if (i % 3 === 0) log(`   … generando (${(i + 1) * 10}s)`);
  }

  if (!estado?.done) throw new Error('Veo tardó más de 13 minutos. Revisa la consola de Google AI Studio.');
  if (estado.error) throw new Error(`Veo falló: ${JSON.stringify(estado.error)}`);

  const uri = estado?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
  if (!uri) throw new Error(`No encontré el video en la respuesta:\n${JSON.stringify(estado).slice(0, 800)}`);

  const bin = await fetch(uri, { headers: { 'x-goog-api-key': cfg.geminiKey }, redirect: 'follow' });
  if (!bin.ok) throw new Error(`No pude descargar el video (${bin.status})`);

  const destino = VARIANTES > 1
    ? path.join(RAIZ, 'assets', `libro_master_${indice + 1}.mp4`)
    : cfg.rutas.master;

  fs.writeFileSync(destino, Buffer.from(await bin.arrayBuffer()));
  log(`✅ Guardado: ${path.relative(RAIZ, destino)} (${(fs.statSync(destino).size / 1e6).toFixed(1)} MB)`);
}

if (!cfg.geminiKey) {
  console.error('❌ Falta GEMINI_API_KEY. Consíguela gratis en https://aistudio.google.com/apikey');
  console.error('   Si no quieres usar IA para el video, corre:  npm run master:local');
  process.exit(1);
}

for (let i = 0; i < VARIANTES; i++) {
  await generarUno(i);
}
log('🎉 Listo. Ahora prueba el pipeline con:  npm run prueba');
