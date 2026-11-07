import dotenv from 'dotenv';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const client = new ElevenLabsClient();

console.log('ElevenLabs client initialized. Testing connection...');

async function test() {
  try {
    const models = await client.models.list();
    console.log('Successfully connected to ElevenLabs! Models count:', models.length);
  } catch (err) {
    console.error('Connection error:', err);
  }
}

test();
