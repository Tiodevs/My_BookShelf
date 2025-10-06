'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Props {
  src: string | null;
  alt: string;
}

export default function BookCover({ src, alt }: Props) {
  const [imgSrc, setImgSrc] = useState(src || '/file.svg');

  return (
    <Image 
      src={imgSrc}
      alt={alt}
      width={200}
      height={300}
      className="w-full h-auto rounded-md object-cover"
      onError={() => setImgSrc('/file.svg')}
    />
  );
}