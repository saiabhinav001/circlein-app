'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function LazyImage({ src, alt, width, height, className, priority = false }: LazyImageProps) {
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  return (
    <div ref={imgRef} className={className}>
      {isInView ? (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={className}
          loading={priority ? 'eager' : 'lazy'}
          priority={priority}
        />
      ) : (
        <div className="bg-slate-200 dark:bg-slate-800 animate-pulse" style={{ width, height }} />
      )}
    </div>
  );
}
