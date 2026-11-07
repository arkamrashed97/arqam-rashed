import dotenv from 'dotenv';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const client = new ElevenLabsClient();

const audioDefs = [
  // 5 Section Ambient Soundscapes (Natural, no music, no electronic buzz, rich acoustic variation)
  {
    name: 'act1-luxor-wind.mp3',
    text: 'Gentle atmospheric desert night breeze blowing softly through ancient temple stone pillars, rich organic air movement, natural ambient recording, peaceful, meditative, zero music, zero electronic hum',
    duration: 18.0,
    loop: true,
    promptInfluence: 0.45
  },
  {
    name: 'act2-kinetic-garden.mp3',
    text: 'Peaceful zen garden atmosphere with gentle distant water droplet dripping on smooth river stone, delicate bamboo rustle and soft paper texture, soothing natural tranquility, zero music',
    duration: 18.0,
    loop: true,
    promptInfluence: 0.45
  },
  {
    name: 'act3-crystal-resonance.mp3',
    text: 'Acoustic quartz crystal singing bowl pure sustained harmonic resonance, serene 432Hz ambient wash, deep mental clarity and soothing calm, zero electronic drone, zero music',
    duration: 18.0,
    loop: true,
    promptInfluence: 0.45
  },
  {
    name: 'act4-twilight-calm.mp3',
    text: 'Warm evening dusk atmosphere over peaceful Egyptian sands, soft comforting twilight breeze, deep gentle tranquility, zero music, zero buzz',
    duration: 18.0,
    loop: true,
    promptInfluence: 0.45
  },
  {
    name: 'act5-dialogue-presence.mp3',
    text: 'Serene warm room presence with subtle soft morning air breathing through open balcony curtains, peaceful clarity, soothing stillness, zero music',
    duration: 18.0,
    loop: true,
    promptInfluence: 0.45
  },

  // 5 Distinct Button Interaction Sounds (one per section)
  {
    name: 'btn-act1.mp3',
    text: 'Soft organic sandstone micro tap, warm, muted, natural rock click',
    duration: 0.8,
    loop: false,
    promptInfluence: 0.7
  },
  {
    name: 'btn-act2.mp3',
    text: 'Crisp delicate bamboo wood tap, light organic click, tactile parchment paper',
    duration: 0.8,
    loop: false,
    promptInfluence: 0.7
  },
  {
    name: 'btn-act3.mp3',
    text: 'Soft crystalline glass droplet ping, delicate bell chime, subtle harmonic',
    duration: 0.8,
    loop: false,
    promptInfluence: 0.7
  },
  {
    name: 'btn-act4.mp3',
    text: 'Warm acoustic water droplet tap, rounded, deep, soft thud',
    duration: 0.8,
    loop: false,
    promptInfluence: 0.7
  },
  {
    name: 'btn-act5.mp3',
    text: 'Crisp modern haptic tactile micro snap, satisfying clean UI click',
    duration: 0.8,
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
      console.log(`✓ Saved ${def.name} (${fs.statSync(filePath).size} bytes)`);
    } catch (err) {
      console.error(`✗ Error generating ${def.name}:`, err.message);
    }
  }
  console.log('All v2 sound generation finished successfully!');
}

generateAll();
