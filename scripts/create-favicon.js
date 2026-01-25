const fs = require('fs');
const sharp = require('sharp');

// Create a simple, clean SVG that will render well at small sizes
const faviconSvg = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="50%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#8B5CF6"/>
    </linearGradient>
  </defs>
  <circle cx="16" cy="16" r="15" fill="url(#bg)"/>
  <path d="M 23 16 A 7 7 0 1 1 16 9 L 16 12 A 4 4 0 1 0 20 16 Z" fill="white"/>
  <circle cx="13" cy="13" r="1.2" fill="#FBBF24"/>
  <circle cx="19" cy="13" r="1.2" fill="#FBBF24"/>
  <circle cx="16" cy="19" r="1.2" fill="#FBBF24"/>
</svg>`;

const icon192Svg = `<svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="50%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#8B5CF6"/>
    </linearGradient>
  </defs>
  <circle cx="96" cy="96" r="90" fill="url(#bg2)"/>
  <path d="M 138 96 A 42 42 0 1 1 96 54 L 96 72 A 24 24 0 1 0 120 96 Z" fill="white"/>
  <circle cx="78" cy="78" r="7" fill="#FBBF24"/>
  <circle cx="114" cy="78" r="7" fill="#FBBF24"/>
  <circle cx="96" cy="114" r="7" fill="#FBBF24"/>
</svg>`;

const icon512Svg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="50%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#8B5CF6"/>
    </linearGradient>
  </defs>
  <circle cx="256" cy="256" r="240" fill="url(#bg3)"/>
  <path d="M 368 256 A 112 112 0 1 1 256 144 L 256 192 A 64 64 0 1 0 320 256 Z" fill="white"/>
  <circle cx="208" cy="208" r="18" fill="#FBBF24"/>
  <circle cx="304" cy="208" r="18" fill="#FBBF24"/>
  <circle cx="256" cy="304" r="18" fill="#FBBF24"/>
</svg>`;

const appleSvg = `<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="50%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#8B5CF6"/>
    </linearGradient>
  </defs>
  <circle cx="90" cy="90" r="85" fill="url(#bg4)"/>
  <path d="M 129 90 A 39 39 0 1 1 90 51 L 90 67 A 23 23 0 1 0 113 90 Z" fill="white"/>
  <circle cx="73" cy="73" r="6.5" fill="#FBBF24"/>
  <circle cx="107" cy="73" r="6.5" fill="#FBBF24"/>
  <circle cx="90" cy="107" r="6.5" fill="#FBBF24"/>
</svg>`;

async function generateIcons() {
  try {
    await sharp(Buffer.from(faviconSvg)).png().toFile('public/favicon.png');
    console.log('Created favicon.png');
    
    await sharp(Buffer.from(icon192Svg)).png().toFile('public/icon-192.png');
    console.log('Created icon-192.png');
    
    await sharp(Buffer.from(icon512Svg)).png().toFile('public/icon-512.png');
    console.log('Created icon-512.png');
    
    await sharp(Buffer.from(appleSvg)).png().toFile('public/apple-touch-icon.png');
    console.log('Created apple-touch-icon.png');
    
    console.log('All icons created successfully!');
  } catch (err) {
    console.error('Error:', err);
  }
}

generateIcons();
