#!/usr/bin/env bash
# Toma un video descargado (de Gemini, Veo, Kling, donde sea) y lo convierte
# en el clip maestro del proyecto: 1080x1920, la duración correcta y con
# entrada/salida en negro.
#
#   bash scripts/integrar-clip.sh "C:/ruta/al/video_descargado.mp4"
#
# Variables opcionales:
#   DUR=12        duración final en segundos (por defecto 12)
#   ESTIRAR=si    ralentiza el clip para llegar a DUR (por defecto sí)
set -euo pipefail
cd "$(dirname "$0")/.."

IN="${1:-}"
[ -z "$IN" ] && { echo "❌ Uso: bash scripts/integrar-clip.sh <archivo.mp4>"; exit 1; }
[ -f "$IN" ] || { echo "❌ No encuentro el archivo: $IN"; exit 1; }

OUT=assets/libro_master.mp4
DUR=${DUR:-12}
ESTIRAR=${ESTIRAR:-si}

ORIG=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$IN")
echo "📥 Entrada: $IN  (${ORIG}s)"

# Factor de ralentización para llegar a DUR sin cortar el movimiento
if [ "$ESTIRAR" = "si" ]; then
  PTS=$(awk "BEGIN{f=$DUR/$ORIG; print (f>1 && f<3.5) ? f : 1}")
else
  PTS=1
fi
FINAL=$(awk "BEGIN{d=$ORIG*$PTS; print (d<$DUR)?d:$DUR}")
FADEOUT=$(awk "BEGIN{print $FINAL-1.0}")
[ "$PTS" != "1" ] && echo "🐢 Ralentizando x$(printf '%.2f' "$PTS") para llegar a ${FINAL}s"

ffmpeg -hide_banner -loglevel error -y -i "$IN" \
  -filter_complex "\
    [0:v]setpts=${PTS}*PTS,\
      scale=1080:1920:force_original_aspect_ratio=increase,\
      crop=1080:1920,setsar=1,fps=30,\
      fade=t=in:st=0:d=1.0:color=black,\
      fade=t=out:st=${FADEOUT}:d=1.0:color=black,\
      format=yuv420p[v]" \
  -map "[v]" -an \
  -c:v libx264 -preset slow -crf 18 -t "$FINAL" "$OUT"

echo "✅ Clip maestro instalado: $OUT"
ffprobe -v error -show_entries stream=width,height -show_entries format=duration -of default=nw=1 "$OUT"
echo ""
echo "👉 Ahora prueba:  npm run prueba"
