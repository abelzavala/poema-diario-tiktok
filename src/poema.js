import fs from 'node:fs';
import path from 'node:path';
import { cfg, log } from './config.js';

const MODELO_CLAUDE = 'claude-sonnet-4-5';
// Se intentan en orden. Si el primero está saturado, se pasa al siguiente.
const MODELOS_GEMINI = (process.env.MODELO_GEMINI || 'gemini-3.6-flash,gemini-3.5-flash,gemini-3.5-flash-lite')
  .split(',').map(m => m.trim()).filter(Boolean);

const dormir = ms => new Promise(r => setTimeout(r, ms));

/** ¿Vale la pena reintentar este error? */
const esTemporal = codigo => [429, 500, 502, 503, 504].includes(codigo);

const TEMAS = [
  'empezar de nuevo', 'la calma después de la tormenta', 'la fuerza que no sabías que tenías',
  'agradecer lo pequeño', 'soltar lo que ya no es tuyo', 'la paciencia del que confía',
  'volver a casa', 'la luz que entra por la grieta', 'el valor de intentarlo otra vez',
  'la belleza de lo sencillo', 'sanar sin prisa', 'creer cuando nadie más cree',
  'el silencio que ordena', 'caminar sin ver el final', 'la semilla y el tiempo',
  'perdonarse a uno mismo', 'la esperanza terca', 'lo que el miedo no puede quitarte',
];

function leerHistorial() {
  try { return JSON.parse(fs.readFileSync(cfg.rutas.historial, 'utf8')); }
  catch { return []; }
}

function guardarHistorial(h) {
  fs.mkdirSync(path.dirname(cfg.rutas.historial), { recursive: true });
  fs.writeFileSync(cfg.rutas.historial, JSON.stringify(h.slice(-120), null, 2));
}

/**
 * Genera un poema original con la API de Claude.
 * Devuelve { versos: string[], tema: string, hashtags: string[] }
 */
export async function generarPoema() {
  if (!cfg.anthropicKey && !cfg.geminiKey)
    throw new Error(
      'Falta la llave del generador de poemas en el archivo .env.\n' +
      '  Opción gratis : GEMINI_API_KEY    → https://aistudio.google.com/apikey\n' +
      '  Opción de pago: ANTHROPIC_API_KEY → https://console.anthropic.com'
    );

  const historial = leerHistorial();
  const usados = historial.slice(-25).map(h => h.tema);
  const disponibles = TEMAS.filter(t => !usados.includes(t));
  const tema = (disponibles.length ? disponibles : TEMAS)[
    Math.floor(Math.random() * (disponibles.length || TEMAS.length))
  ];

  const prompt = `Escribe un poema breve, original y en español sobre: ${tema}.

REGLAS ESTRICTAS:
- Exactamente 4 versos (líneas). Ni uno más.
- Máximo 42 caracteres por verso. Es crítico: se mostrará sobre la página de un libro en formato vertical y si es más largo se corta.
- Tono: motivacional, íntimo, esperanzador. Como una frase que alguien guarda en su cartera.
- Español neutro de Latinoamérica. Nada de "vosotros".
- Sin comillas, sin título, sin emojis, sin numeración, sin hashtags.
- No imites ni cites a ningún poeta existente. Debe ser 100% original.
- Evita clichés muy gastados ("brillar como estrella", "mariposas en el estómago").
- Que la última línea deje una sensación de calma o de impulso.

Estos son los últimos poemas publicados, NO te repitas ni en imágenes ni en estructura:
${historial.slice(-8).map(h => h.versos.join(' / ')).join('\n') || '(ninguno todavía)'}

Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional ni bloques de código:
{"versos": ["...", "...", "...", "..."], "titulo_corto": "3 o 4 palabras para el caption"}`;

  const texto = cfg.anthropicKey
    ? await pedirAClaude(prompt)
    : await pedirAGemini(prompt);

  const json = texto.replace(/^```(?:json)?|```$/gm, '').trim();

  let poema;
  try { poema = JSON.parse(json); }
  catch { throw new Error(`El modelo no devolvió JSON válido:\n${texto}`); }

  // Validación y saneado
  poema.versos = (poema.versos || [])
    .map(v => String(v).replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, 4);

  if (poema.versos.length < 3) throw new Error('El poema salió con menos de 3 versos');

  const largo = poema.versos.find(v => v.length > 48);
  if (largo) log(`⚠️  Verso largo (${largo.length} car.), se reducirá el tamaño de letra: "${largo}"`);

  poema.tema = tema;
  poema.titulo_corto = poema.titulo_corto || tema;

  historial.push({ fecha: new Date().toISOString(), tema, versos: poema.versos });
  guardarHistorial(historial);

  return poema;
}

/** Proveedor A — API de Claude (de pago, ~$0.19 USD/mes) */
async function pedirAClaude(prompt) {
  log(`   usando Claude (${MODELO_CLAUDE})`);
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': cfg.anthropicKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODELO_CLAUDE,
      max_tokens: 500,
      temperature: 1,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!r.ok) throw new Error(`API de Claude falló (${r.status}): ${await r.text()}`);
  const data = await r.json();
  return data.content.map(b => b.text || '').join('').trim();
}

/**
 * Proveedor B — API de Gemini (nivel gratuito, sin tarjeta)
 * Reintenta ante saturación y cambia de modelo si uno no está disponible.
 */
async function pedirAGemini(prompt) {
  let ultimo;
  for (const modelo of MODELOS_GEMINI) {
    for (let intento = 1; intento <= 3; intento++) {
      try {
        return await llamarAGemini(prompt, modelo, intento);
      } catch (e) {
        ultimo = e;
        const codigo = e.codigo ?? 0;

        // 404 = el modelo ya no existe: pasamos al siguiente sin reintentar
        if (codigo === 404) {
          log(`   ⚠️  "${modelo}" ya no está disponible, probando el siguiente…`);
          break;
        }
        // Error definitivo (llave inválida, permisos): no tiene caso insistir
        if (!esTemporal(codigo)) throw e;

        if (intento === 3) {
          log(`   ⚠️  "${modelo}" sigue saturado, probando el siguiente modelo…`);
          break;
        }
        const espera = process.env.PRUEBA ? 10 : intento * 6000;
        log(`   ⏳ ${modelo} saturado (${codigo}). Reintento en ${espera / 1000}s…`);
        await dormir(espera);
      }
    }
  }
  throw ultimo ?? new Error('No se pudo obtener el poema de ningún modelo de Gemini');
}

async function llamarAGemini(prompt, modelo, intento) {
  log(`   usando Gemini (${modelo}, nivel gratuito)${intento > 1 ? ` · intento ${intento}` : ''}`);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'x-goog-api-key': cfg.geminiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 1.15,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            versos: { type: 'ARRAY', items: { type: 'STRING' } },
            titulo_corto: { type: 'STRING' },
          },
          required: ['versos'],
        },
      },
    }),
  });

  if (!r.ok) {
    const cuerpo = await r.text();
    const err = new Error(`API de Gemini falló (${r.status}): ${cuerpo.slice(0, 300)}`);
    err.codigo = r.status;
    throw err;
  }
  const data = await r.json();
  const t = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
  if (!t) throw new Error(`Gemini devolvió una respuesta vacía:\n${JSON.stringify(data).slice(0, 500)}`);
  return t;
}
