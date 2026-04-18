'use client';
import { useState } from 'react';
import Image from 'next/image';
import { ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props { images: string[]; name: string; }

export function ProductGallery({ images, name }: Props) {
  const [active,   setActive]   = useState(0);
  const [zoomed,   setZoomed]   = useState(false);
  const [mousePos, setMousePos] = useState({ x:50, y:50 });

  const prev = () => setActive(a => (a-1+images.length) % images.length);
  const next = () => setActive(a => (a+1) % images.length);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width)  * 100,
      y: ((e.clientY - rect.top)  / rect.height) * 100,
    });
  };

  return (
    <div className="flex flex-col-reverse md:flex-row gap-3 p-4 md:p-8 lg:p-10">
      {/* Thumbnails */}
      <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-[720px] pb-2 md:pb-0">
        {images.map((img, i) => (
          <button key={i} onClick={() => setActive(i)}
            className={`relative w-16 h-20 md:w-20 md:h-28 shrink-0 overflow-hidden border-2 transition-all ${active===i?'border-black':'border-transparent opacity-55 hover:opacity-100'}`}>
            <Image src={img} alt={`${name} view ${i+1}`} fill className="object-cover" sizes="80px"/>
          </button>
        ))}
      </div>

      {/* Main image */}
      <div className="relative flex-1 aspect-[3/4] bg-cream overflow-hidden"
        onClick={() => setZoomed(!zoomed)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setZoomed(false)}
        style={{ cursor: zoomed ? 'zoom-out' : 'zoom-in' }}>
        <Image src={images[active]} alt={name} fill priority
          className="object-cover transition-transform duration-150"
          style={zoomed ? { transform:`scale(2.2)`, transformOrigin:`${mousePos.x}% ${mousePos.y}%` } : {}}
          sizes="(max-width:768px) 100vw, 50vw"/>

        {/* Prev / next arrows on mobile */}
        {images.length > 1 && (
          <>
            <button onClick={e => { e.stopPropagation(); prev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors md:hidden">
              <ChevronLeft size={18}/>
            </button>
            <button onClick={e => { e.stopPropagation(); next(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors md:hidden">
              <ChevronRight size={18}/>
            </button>
          </>
        )}

        {!zoomed && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/90 px-3 py-1.5 text-[10px] tracking-wider uppercase pointer-events-none">
            <ZoomIn size={12}/> Hover to zoom
          </div>
        )}

        {/* Mobile counter */}
        <div className="absolute bottom-4 left-4 bg-black/50 text-white text-[10px] tracking-wider px-2.5 py-1 md:hidden">
          {active+1} / {images.length}
        </div>
      </div>
    </div>
  );
}
