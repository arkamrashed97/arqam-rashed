/**
 * ElevenLabs sound-effect generator for the portfolio.
 *
 * Usage (from repo root):
 *   node --env-file=.env.local tools/audio/generate.mjs            # generate missing files only
 *   node --env-file=.env.local tools/audio/generate.mjs --force    # regenerate everything
 *   node --env-file=.env.local tools/audio/generate.mjs --only=toggle-on,toggle-off
 *
 * The generated MP3 files are committed to `assets/audio/`, so the site never calls
 * ElevenLabs at runtime. The API key lives in `.env.local` (git-ignored).
 *
 * Design rules for every prompt: no music, no harshness, no electronic hum, low
 * perceived loudness, short tails. They must feel calming on speakers and earbuds.
 */
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('assets/audio');
const CALM = 'soft, warm, gentle, calming, never harsh, no music, no electronic hum, low volume';

export const SOUNDS = [
  // ---- v3 additions: interaction vocabulary --------------------------------
  { name: 'gate-open.mp3', duration: 2.0, influence: 0.55, text: `Soft airy welcoming whoosh with a warm distant wooden chime, entering a calm temple, ${CALM}` },
  { name: 'toggle-on.mp3', duration: 0.8, influence: 0.7, text: `Soft warm rising two-note marimba tap, gentle switch turning on, ${CALM}` },
  { name: 'toggle-off.mp3', duration: 0.8, influence: 0.7, text: `Soft warm falling muted tap, gentle switch turning off, ${CALM}` },
  { name: 'hover-soft.mp3', duration: 0.5, influence: 0.8, text: 'Extremely subtle soft airy paper brush tick, barely audible, very quiet, no music' },
  { name: 'enter-act1.mp3', duration: 1.6, influence: 0.5, text: `Gentle breath of warm desert air over smooth sandstone, calm scene transition, ${CALM}` },
  { name: 'enter-act2.mp3', duration: 1.6, influence: 0.5, text: `Gentle soft paper page slide with a light bamboo breath, calm scene transition, ${CALM}` },
  { name: 'enter-act3.mp3', duration: 1.8, influence: 0.5, text: `Delicate crystal shimmer rising softly with airy glass resonance, calm scene transition, ${CALM}` },
  { name: 'enter-act4.mp3', duration: 1.8, influence: 0.5, text: `Warm low soft breath of evening wind with a gentle deep water ripple, calm scene transition, ${CALM}` },
  { name: 'enter-act5.mp3', duration: 1.8, influence: 0.5, text: `Gentle open doorway air swell with a soft warm tone bloom, welcoming calm scene transition, ${CALM}` },
  { name: 'modal-open.mp3', duration: 1.0, influence: 0.65, text: `Soft smooth wooden drawer sliding open with a gentle low thump, ${CALM}` },
  { name: 'modal-close.mp3', duration: 0.8, influence: 0.65, text: `Soft gentle wooden drawer closing with a muted tap, ${CALM}` },
  { name: 'cluster-select.mp3', duration: 0.9, influence: 0.65, text: `Soft crystal glass tap with a short gentle shimmer tail, ${CALM}` },
  { name: 'copy-success.mp3', duration: 1.0, influence: 0.65, text: `Gentle pleasant soft bell pluck, success confirmation, ${CALM}` },
  { name: 'form-success.mp3', duration: 2.0, influence: 0.55, text: `Warm gentle resolved sequence of three soft bell notes, satisfying completion, ${CALM}` },
  { name: 'form-error.mp3', duration: 0.8, influence: 0.7, text: `Very soft low muted wooden thud, gentle notification, not alarming, ${CALM}` },
  { name: 'download-ok.mp3', duration: 1.0, influence: 0.65, text: `Soft paper drop followed by a gentle pluck, file saved confirmation, ${CALM}` },
  { name: 'type-tick.mp3', duration: 0.5, influence: 0.8, text: 'Very soft quiet single keyboard key tap, muted, subtle, no music' }
];

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const onlyArg = args.find((a) => a.startsWith('--only='));
  const only = onlyArg ? onlyArg.slice(7).split(',').map((s) => s.trim()) : null;

  if (!process.env.ELEVENLABS_API_KEY) {
    console.error('ELEVENLABS_API_KEY is missing. Run with: node --env-file=.env.local tools/audio/generate.mjs');
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const client = new ElevenLabsClient();

  for (const def of SOUNDS) {
    if (only && !only.includes(def.name.replace(/\.mp3$/, ''))) continue;
    const file = path.join(OUT_DIR, def.name);
    if (!force && fs.existsSync(file) && fs.statSync(file).size > 1000) {
      console.log(`skip   ${def.name} (exists)`);
      continue;
    }
    try {
      const stream = await client.textToSoundEffects.convert({
        text: def.text,
        modelId: 'eleven_text_to_sound_v2',
        durationSeconds: def.duration,
        promptInfluence: def.influence,
        loop: false
      });
      const reader = stream.getReader();
      const chunks = [];
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      fs.writeFileSync(file, Buffer.concat(chunks));
      console.log(`saved  ${def.name} (${fs.statSync(file).size} bytes)`);
    } catch (err) {
      console.error(`FAILED ${def.name}: ${err.message}`);
    }
  }
}

main();
