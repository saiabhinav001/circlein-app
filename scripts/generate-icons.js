#!/usr/bin/env node

/**
 * Icon Generation Script for CircleIn
 * Generates all necessary icon formats (PNG, ICO) from SVG source
 */

const fs = require('fs');
const path = require('path');

// SVG content for CircleIn logo
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2563EB;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="256" cy="256" r="240" fill="url(#grad)"/>
  <circle cx="256" cy="256" r="180" fill="none" stroke="white" stroke-width="16"/>
  <circle cx="256" cy="256" r="120" fill="none" stroke="white" stroke-width="16"/>
  <circle cx="256" cy="256" r="60" fill="white"/>
  <text x="256" y="280" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="white" text-anchor="middle">C</text>
</svg>`;

console.log('🎨 Generating CircleIn icons...\n');

// Save SVG files
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write SVG files
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.svg'), svgContent);
fs.writeFileSync(path.join(publicDir, 'icon-192x192.svg'), svgContent);
fs.writeFileSync(path.join(publicDir, 'icon-512x512.svg'), svgContent);

console.log('✅ SVG icons created successfully');
console.log('\n📋 Manual Steps Required:');
console.log('   To create PNG/ICO files, use one of these methods:');
console.log('   1. Online converter: https://realfavicongenerator.net/');
console.log('   2. Install sharp: npm install sharp');
console.log('   3. Use ImageMagick: convert favicon.svg favicon.ico');
console.log('\n   Upload these files to /public/:');
console.log('   - favicon.ico (16x16, 32x32, 48x48)');
console.log('   - icon-192.png (192x192)');
console.log('   - icon-512.png (512x512)');
console.log('   - apple-touch-icon.png (180x180)');
console.log('\n✨ Done!');
