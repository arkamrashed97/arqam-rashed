import dotenv from 'dotenv';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const client = new ElevenLabsClient();

const audioDefs = [
  {
    name: 'act1-desert-wind.mp3',
    text: 'Gentle warm night breeze blowing softly over ancient stone monoliths, low frequency, completely relaxing, soothing, meditative, no music, seamless natural ambient atmosphere',
    duration: 8.0,
    loop: true,
    promptInfluence: 0.4
  },
  {
    name: 'act2-kinetic-chime.mp3',
    text: 'Soft organic tactile bamboo chime and delicate silk paper rustle, smooth, calm, gentle, no harshness, no music',
    duration: 6.0,
    loop: true,
    promptInfluence: 0.4
  },
  {
    name: 'act3-crystal-resonance.mp3',
    text: 'Pure harmonic crystal singing bowl sustained resonance, binaural relaxation tone, spatial, tranquil, peaceful, healing frequency, no music',
    duration: 8.0,
    loop: true,
    promptInfluence: 0.45
  },
  {
    name: 'act4-gravitational-calm.mp3',
    text: 'Deep warm sub-bass cosmic quietude, gentle gravitational breath, soothing stillness, peaceful presence, no melody, no music',
    duration: 8.0,
    loop: true,
    promptInfluence: 0.4
  },
  {
    name: 'ui-click.mp3',
    text: 'Delicate soft wooden marimba micro tap, gentle UI click, rounded, warm, zero harshness',
    duration: 1.0,
    loop: false,
    promptInfluence: 0.7
  }
];

async function generateAll() {
  const outDir = path.resolve('assets/audio');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const def of audioDefs) {
    const filePath = path.join(outDir, def.name);
    console.log(`Generating ${def.name}...`);
    try {
      const webStream = await client.textToSoundEffects.convert({
        text: def.text,
        modelId: 'eleven_text_to_sound_v3',
        durationSeconds: def.duration,
        promptInfluence: def.promptInfluence,
        loop: def.loop
      });

      const reader = webStream.getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      fs.writeFileSync(filePath, Buffer.concat(chunks));
      console.log(`✓ Successfully saved: ${def.name} (${fs.statSync(filePath).size} bytes)`);
    } catch (err) {
      console.error(`✗ Error generating ${def.name}:`, err.message);
    }
  }
  console.log('Audio generation finished.');
}

generateAll();
