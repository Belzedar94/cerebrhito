import React, { useState } from 'react';
import Image from 'next/image';
import { Loading } from './Loading';

interface LazyImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({ src, alt, width, height, className }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loading size="small" />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onLoadingComplete={() => setIsLoading(false)}
        loading="lazy"
      />
    </div>
  );
};