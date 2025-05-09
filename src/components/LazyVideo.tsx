'use client';

import { useState, useRef, useEffect } from 'react';

interface LazyVideoProps {
  src: string;
  title: string;
  className?: string;
}

export default function LazyVideo({ src, title, className = '' }: LazyVideoProps) {
  const [isVisible, setIsVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {isVisible ? (
        <video
          ref={videoRef}
          src={src}
          controls
          preload="metadata"
          className="w-full h-48 object-cover rounded"
          title={title}
        />
      ) : (
        <div className="w-full h-48 bg-gray-200 rounded animate-pulse flex items-center justify-center">
          <span className="text-gray-400">Loading video...</span>
        </div>
      )}
    </div>
  );
} 