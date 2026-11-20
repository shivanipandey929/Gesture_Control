const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'public', 'media');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const sampleRate = 44100;
const durationSec = 12;
const numSamples = sampleRate * durationSec;
const numChannels = 2;
const bytesPerSample = 2;
const blockAlign = numChannels * bytesPerSample;
const byteRate = sampleRate * blockAlign;
const dataSize = numSamples * blockAlign;

const buffer = Buffer.alloc(44 + dataSize);

// RIFF header
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write('WAVE', 8);

// fmt subchunk
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20); // PCM
buffer.writeUInt16LE(numChannels, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(byteRate, 28);
buffer.writeUInt16LE(blockAlign, 32);
buffer.writeUInt16LE(16, 34);

// data subchunk
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);

// Chord progression: C - Am - F - G
const notes = [261.63, 329.63, 392.00, 440.00, 349.23, 392.00, 440.00, 523.25];
const noteDuration = durationSec / notes.length;

let offset = 44;
for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  const noteIdx = Math.floor(t / noteDuration) % notes.length;
  const freq = notes[noteIdx];
  const noteT = t % noteDuration;

  // Smooth ADSR envelope
  const attack = Math.min(1, noteT / 0.1);
  const release = Math.max(0, 1 - (noteT / noteDuration));
  const env = attack * release;

  // Harmonically rich warm synth tone
  const wave = (
    Math.sin(2 * Math.PI * freq * t) * 0.5 +
    Math.sin(2 * Math.PI * (freq * 2) * t) * 0.25 +
    Math.sin(2 * Math.PI * (freq * 1.5) * t) * 0.15 +
    Math.sin(2 * Math.PI * (freq * 0.5) * t) * 0.1
  ) * env * 0.45;

  const sample16 = Math.max(-32768, Math.min(32767, Math.floor(wave * 32767)));

  buffer.writeInt16LE(sample16, offset);
  buffer.writeInt16LE(sample16, offset + 2);
  offset += 4;
}

const filePath = path.join(dir, 'ambient.wav');
fs.writeFileSync(filePath, buffer);
console.log('Successfully generated offline audio track at:', filePath, 'Size:', buffer.length);

