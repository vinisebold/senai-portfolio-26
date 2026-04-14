import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

/**
 * Carousel Component - Editorial Image Gallery
 *
 * Design principles:
 * - Minimal controls: only arrows and counter
 * - No dots, no thumbnails
 * - Counter in bottom-right: "01 / 04" format
 * - Full-width images at 480px height
 * - If only 1 image: no controls, static display
 * - Arrows appear on hover, ultra-minimal styling
 */

const Carousel = ({ images }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const renderMedia = (media, index) => {
    if (media?.type === 'video') {
      return (
        <video
          key={`video-${index}`}
          src={media.src}
          className="w-full h-full object-cover bg-stone"
          controls
          muted
          playsInline
          preload="metadata"
        />
      );
    }

    return (
      <img
        key={`image-${index}`}
        src={media.src}
        alt={media.alt}
        className="w-full h-full object-cover bg-stone"
      />
    );
  };

  // Single image: static display, no controls
  if (images.length === 1) {
    return (
      <div className="relative w-full h-[480px] bg-stone">
        {renderMedia(images[0], 0)}
      </div>
    );
  }

  // Multiple images: embla carousel with controls
  return (
    <div className="relative w-full h-[480px] group">
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full">
          {images.map((image, index) => (
            <div key={index} className="flex-[0_0_100%] min-w-0 relative">
              {renderMedia(image, index)}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows - appear on hover */}
      <button
        onClick={scrollPrev}
        className="absolute left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 p-3 hover:bg-white"
        aria-label="Previous image"
      >
        <ChevronLeft size={24} strokeWidth={1} />
      </button>

      <button
        onClick={scrollNext}
        className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 p-3 hover:bg-white"
        aria-label="Next image"
      >
        <ChevronRight size={24} strokeWidth={1} />
      </button>

      {/* Image counter - bottom right, always visible */}
      <div className="absolute bottom-4 right-4 bg-white/90 px-3 py-1.5">
        <span className="font-inter text-[10px] font-light tracking-wider">
          {String(selectedIndex + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
};

export default Carousel;
