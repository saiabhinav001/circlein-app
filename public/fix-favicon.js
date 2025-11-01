// Script to ensure favicon loads properly
// Run this in the browser console if favicon doesn't show

(function() {
  console.log('🔍 Checking favicon...');
  
  // Remove existing favicon links
  const existingLinks = document.querySelectorAll('link[rel*="icon"]');
  existingLinks.forEach(link => link.remove());
  
  // Add fresh favicon links
  const head = document.head;
  
  // SVG favicon
  const svgLink = document.createElement('link');
  svgLink.rel = 'icon';
  svgLink.type = 'image/svg+xml';
  svgLink.href = '/favicon.svg?' + new Date().getTime();
  head.appendChild(svgLink);
  
  // Apple touch icon
  const appleLink = document.createElement('link');
  appleLink.rel = 'apple-touch-icon';
  appleLink.href = '/apple-touch-icon.svg?' + new Date().getTime();
  head.appendChild(appleLink);
  
  console.log('✅ Favicon reloaded!');
  console.log('📍 Links added:', {
    svg: svgLink.href,
    apple: appleLink.href
  });
})();
