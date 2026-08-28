#!/usr/bin/env node
/**
 * Pipeline diario: poema → video → TikTok
 * Uso:  node src/index.js            (genera y publica)
 *       node src/index.js --dry-run  (genera pero NO publica)
 */
import { cfg, log, hoy } from './config.js';
import { generarPoema } from './poema.js';
import { renderizar } from './render.js';
import { publicarEnTikTok, caption } from './publicar.js';

const seco = process.argv.includes('--dry-run') || !cfg.publicar;

async function main() {
  const { iso, largo } = hoy();
  log(`━━━ Poema del día · ${largo} ━━━`);

  log('✍️  Pidiendo el poema del día…');
  const poema = await generarPoema();
  console.log('\n' + poema.versos.map(v => '   ' + v).join('\n') + '\n');
  log(`   (tema: ${poema.tema})`);

  const video = await renderizar(poema);

  const texto = caption(poema, largo);

  if (seco) {
    log('🧪 Modo prueba: NO se publica. El video quedó en la carpeta "salidas".');
    console.log('\n--- Texto que se publicaría ---\n' + texto + '\n');
    return { video, iso };
  }

  await publicarEnTikTok(video, texto);
  log('🎉 Terminado.');
  return { video, iso };
}

main().catch(e => {
  console.error('\n❌ FALLÓ:', e.message);
  process.exitCode = 1;   // salida limpia; process.exit() rompe en Windows
});
