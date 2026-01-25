const fs = require('fs');
const sharp = require('sharp');

// This SVG matches the CircleInLogo component exactly
const faviconSvg = `<svg width="32" height="32" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="50%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#8B5CF6"/>
    </linearGradient>
    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FBBF24"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>
  </defs>
  
  <!-- Main Circle -->
  <circle cx="60" cy="60" r="54" fill="url(#mainGradient)"/>
  
  <!-- White highlight -->
  <ellipse cx="60" cy="35" rx="40" ry="20" fill="#FFFFFF" opacity="0.25"/>
  
  <!-- Modern C lettermark -->
  <path d="M 86 60 A 26 26 0 1 1 60 34 L 60 46 A 14 14 0 1 0 74 60 Z" fill="white" opacity="0.98"/>
  
  <!-- Three Golden Dots -->
  <circle cx="48" cy="49" r="4.5" fill="url(#goldGradient)"/>
  <circle cx="72" cy="49" r="4.5" fill="url(#goldGradient)"/>
  <circle cx="60" cy="71" r="4.5" fill="url(#goldGradient)"/>
  
  <!-- Connection Lines -->
  <g stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.5">
    <line x1="48" y1="49" x2="72" y2="49"/>
    <line x1="48" y1="49" x2="60" y2="71"/>
    <line x1="72" y1="49" x2="60" y2="71"/>
  </g>
  
  <!-- Decorative Ring -->
  <circle cx="60" cy="60" r="48" fill="none" stroke="white" stroke-width="1.5" opacity="0.3"/>
</svg>`;

const icon192Svg = faviconSvg.replace('width="32" height="32"', 'width="192" height="192"');
const icon512Svg = faviconSvg.replace('width="32" height="32"', 'width="512" height="512"');
const appleIconSvg = faviconSvg.replace('width="32" height="32"', 'width="180" height="180"');

async function generateIcons() {
  try {
    // Generate PNG files
    await sharp(Buffer.from(faviconSvg), { density: 300 })
      .resize(32, 32)
      .png()
      .toFile('public/favicon.png');
    console.log('Created favicon.png');
    
    await sharp(Buffer.from(icon192Svg), { density: 300 })
      .resize(192, 192)
      .png()
      .toFile('public/icon-192.png');
    console.log('Created icon-192.png');
    
    await sharp(Buffer.from(icon512Svg), { density: 300 })
      .resize(512, 512)
      .png()
      .toFile('public/icon-512.png');
    console.log('Created icon-512.png');
    
    await sharp(Buffer.from(appleIconSvg), { density: 300 })
      .resize(180, 180)
      .png()
      .toFile('public/apple-touch-icon.png');
    console.log('Created apple-touch-icon.png');
    
    // Generate ICO from the PNG
    const pngToIco = require('png-to-ico');
    const icoBuffer = await pngToIco(['public/favicon.png']);
    fs.writeFileSync('public/favicon.ico', icoBuffer);
    console.log('Created favicon.ico');
    
    console.log('All icons created successfully!');
  } catch (err) {
    console.error('Error:', err);
  }
}

generateIcons();
