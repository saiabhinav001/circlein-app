import { NextResponse } from 'next/server';

// ICO file header and data for a 32x32 icon
// This is a simple blue gradient circle with C
const generateFaviconICO = (): Buffer => {
  // Create a simple 32x32 ICO file
  const size = 32;
  const bpp = 32; // bits per pixel (RGBA)
  
  // ICO Header (6 bytes)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type (1 = ICO)
  header.writeUInt16LE(1, 4); // Number of images
  
  // Image directory entry (16 bytes)
  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(size, 0); // Width
  dirEntry.writeUInt8(size, 1); // Height
  dirEntry.writeUInt8(0, 2); // Color palette
  dirEntry.writeUInt8(0, 3); // Reserved
  dirEntry.writeUInt16LE(1, 4); // Color planes
  dirEntry.writeUInt16LE(bpp, 6); // Bits per pixel
  
  // BMP info header (40 bytes)
  const bmpHeader = Buffer.alloc(40);
  bmpHeader.writeUInt32LE(40, 0); // Header size
  bmpHeader.writeInt32LE(size, 4); // Width
  bmpHeader.writeInt32LE(size * 2, 8); // Height (doubled for ICO format)
  bmpHeader.writeUInt16LE(1, 12); // Planes
  bmpHeader.writeUInt16LE(bpp, 14); // Bits per pixel
  bmpHeader.writeUInt32LE(0, 16); // Compression
  bmpHeader.writeUInt32LE(size * size * 4, 20); // Image size
  
  // Pixel data (BGRA format, bottom-up)
  const pixels = Buffer.alloc(size * size * 4);
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = 14;
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Flip Y for bottom-up format
      const flippedY = size - 1 - y;
      const idx = (flippedY * size + x) * 4;
      
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist <= radius) {
        // Inside circle - gradient from blue to purple
        const t = (x + y) / (size * 2);
        const r = Math.floor(59 + t * 109); // 3B to A8
        const g = Math.floor(130 - t * 45); // 82 to 55
        const b = Math.floor(246 - t * 9); // F6 to ED
        
        pixels[idx] = b; // B
        pixels[idx + 1] = g; // G
        pixels[idx + 2] = r; // R
        pixels[idx + 3] = 255; // A
      } else {
        // Outside circle - transparent
        pixels[idx] = 0;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        pixels[idx + 3] = 0;
      }
    }
  }
  
  // AND mask (transparency mask)
  const maskRowSize = Math.ceil(size / 8);
  const maskSize = maskRowSize * size;
  const andMask = Buffer.alloc(maskSize);
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const flippedY = size - 1 - y;
      const byteIdx = flippedY * maskRowSize + Math.floor(x / 8);
      const bitIdx = 7 - (x % 8);
      
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > radius) {
        andMask[byteIdx] |= (1 << bitIdx);
      }
    }
  }
  
  const imageData = Buffer.concat([bmpHeader, pixels, andMask]);
  const imageSize = imageData.length;
  const imageOffset = 6 + 16; // header + directory
  
  dirEntry.writeUInt32LE(imageSize, 8); // Image size
  dirEntry.writeUInt32LE(imageOffset, 12); // Image offset
  
  return Buffer.concat([header, dirEntry, imageData]);
};

export async function GET() {
  const favicon = generateFaviconICO();
  
  return new NextResponse(favicon, {
    headers: {
      'Content-Type': 'image/x-icon',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
