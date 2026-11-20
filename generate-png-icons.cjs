const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Standard CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function generatePng(width, height, drawFn) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // filter standard
  ihdr[12] = 0; // no interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw Scanlines: each row has 1 filter byte (0) + width * 4 bytes
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

// Icon generator (AeroTouch cyan hand / wave stylized icon)
function drawAppIcon(x, y, width, height, isMaskable = false) {
  const cx = width / 2;
  const cy = height / 2;
  const scale = isMaskable ? 0.65 : 0.85;
  const rLimit = (width / 2) * scale;

  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background
  let r = 11, g = 16, b = 32, a = 255; // #0B1020

  // Rounded icon container if not maskable
  if (!isMaskable && dist > rLimit * 1.1) {
    return [0, 0, 0, 0];
  }

  // Cyan gradient ring
  const ringInner = rLimit * 0.75;
  const ringOuter = rLimit * 0.95;
  if (dist >= ringInner && dist <= ringOuter) {
    return [34, 211, 238, 255]; // #22D3EE
  }

  // Wave / Gesture shapes in center
  const nx = (x - cx) / (rLimit * 0.6);
  const ny = (y - cy) / (rLimit * 0.6);

  // Stylized finger bars
  const inBar1 = Math.abs(nx + 0.35) < 0.12 && ny > -0.6 && ny < 0.5;
  const inBar2 = Math.abs(nx - 0.0) < 0.12 && ny > -0.8 && ny < 0.5;
  const inBar3 = Math.abs(nx - 0.35) < 0.12 && ny > -0.5 && ny < 0.5;
  const inPalm = Math.sqrt(nx * nx + (ny - 0.5) * (ny - 0.5)) < 0.45;

  if (inBar1 || inBar2 || inBar3 || inPalm) {
    return [56, 189, 248, 255]; // cyan-400
  }

  return [r, g, b, a];
}

function drawScreenshot(x, y, width, height, _isWide) {
  // AeroTouch dark tech theme preview
  const r = 11, g = 16, b = 32;
  // Header bar
  if (y < height * 0.08) {
    return [15, 23, 42, 255]; // slate-900
  }
  // Cyan accents
  if (y > height * 0.08 && y < height * 0.09) {
    return [34, 211, 238, 255];
  }
  // Grid / cards
  const gridY = Math.floor((y - height * 0.1) / (height * 0.25));
  const gridX = Math.floor(x / (width * 0.5));
  if ((gridX + gridY) % 2 === 0 && x > 20 && x < width - 20) {
    return [30, 41, 59, 255]; // slate-800
  }
  return [r, g, b, 255];
}

const publicDir = path.join(__dirname, 'public');
const screenshotsDir = path.join(publicDir, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

console.log('Generating PNG icons and screenshots...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePng(192, 192, (x, y, w, h) => drawAppIcon(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePng(512, 512, (x, y, w, h) => drawAppIcon(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512-maskable.png'), generatePng(512, 512, (x, y, w, h) => drawAppIcon(x, y, w, h, true)));

fs.writeFileSync(path.join(screenshotsDir, 'wide.png'), generatePng(1280, 720, (x, y, w, h) => drawScreenshot(x, y, w, h, true)));
fs.writeFileSync(path.join(screenshotsDir, 'narrow.png'), generatePng(750, 1334, (x, y, w, h) => drawScreenshot(x, y, w, h, false)));

console.log('PNG generation complete!');
