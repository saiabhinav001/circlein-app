'use client';

import { useEffect } from 'react';

export function PerformanceMonitor() {
  useEffect(() => {
    // Report Web Vitals
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Log FCP (First Contentful Paint)
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
            console.log('FCP:', entry.startTime);
          }
        }
      });
      
      try {
        observer.observe({ entryTypes: ['paint'] });
      } catch (e) {
        // Ignore errors in older browsers
      }

      // Log page load time
      window.addEventListener('load', () => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log('Page Load Time:', pageLoadTime + 'ms');
      });
    }
  }, []);

  return null;
}
