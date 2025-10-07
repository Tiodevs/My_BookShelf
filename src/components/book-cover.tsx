'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Props {
  src: string | null;
  alt: string;
}

export default function BookCover({ src, alt }: Props) {
  const [imgSrc, setImgSrc] = useState('/file.svg');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (src && src.trim() !== '') {
      setImgSrc(src);
      setHasError(false);
    } else {
      setImgSrc('/file.svg');
    }
  }, [src]);

  const handleError = () => {
    setHasError(true);
    setImgSrc('/file.svg');
  };

  return (
    <div className="w-full h-[300px] bg-muted rounded-md flex items-center justify-center overflow-hidden">
      <Image 
        src={imgSrc}
        alt={alt}
        width={200}
        height={300}
        className="w-full h-full object-cover"
        onError={handleError}
        unoptimized={src?.includes('amazon') || src?.includes('google')}
      />
    </div>
  );
}