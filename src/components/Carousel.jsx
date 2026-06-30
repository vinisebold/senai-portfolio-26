import useEmblaCarousel from 'embla-carousel-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const ease = [0.43, 0.13, 0.23, 0.96];
const emptyClip = 'inset(0px 0px 0px 0px)';
let activeFocusTransition = false;

const toPlainRect = (rect) => ({
  left: rect.left,
  top: rect.top,
  width: rect.width,
  height: rect.height,
});

const toMotionRect = (rect) => ({
  left: rect.left,
  top: rect.top,
  width: rect.width,
  height: rect.height,
});

const getImageSize = (imageElement) => {
  if (!imageElement?.naturalWidth || !imageElement?.naturalHeight) return null;

  return {
    width: imageElement.naturalWidth,
    height: imageElement.naturalHeight,
  };
};

const getCoverImageRect = (containerRect, imageSize) => {
  const scale = Math.max(
    containerRect.width / imageSize.width,
    containerRect.height / imageSize.height,
  );
  const width = imageSize.width * scale;
  const height = imageSize.height * scale;

  return {
    width,
    height,
    left: containerRect.left + ((containerRect.width - width) / 2),
    top: containerRect.top + ((containerRect.height - height) / 2),
  };
};

const getClipInsets = (imageRect, cropRect) => ({
  top: Math.max(0, cropRect.top - imageRect.top),
  right: Math.max(0, (imageRect.left + imageRect.width) - (cropRect.left + cropRect.width)),
  bottom: Math.max(0, (imageRect.top + imageRect.height) - (cropRect.top + cropRect.height)),
  left: Math.max(0, cropRect.left - imageRect.left),
});

const toClipPath = (clip) => (
  `inset(${clip.top}px ${clip.right}px ${clip.bottom}px ${clip.left}px)`
);

const getContainRect = (imageSize, fallbackRect) => {
  if (typeof window === 'undefined') return fallbackRect;

  const padding = window.innerWidth < 768 ? 16 : 32;
  const availableWidth = Math.max(1, window.innerWidth - (padding * 2));
  const availableHeight = Math.max(1, window.innerHeight - (padding * 2));
  const aspectRatio = imageSize?.width && imageSize?.height
    ? imageSize.width / imageSize.height
    : fallbackRect.width / fallbackRect.height;

  let width = availableWidth;
  let height = width / aspectRatio;

  if (height > availableHeight) {
    height = availableHeight;
    width = height * aspectRatio;
  }

  return {
    width,
    height,
    left: (window.innerWidth - width) / 2,
    top: (window.innerHeight - height) / 2,
  };
};

const FocusCarousel = ({
  images,
  initialIndex,
  originRect,
  originClip,
  mediaSizes,
  onFocusIndexChange,
  onCloseStart,
  onClosed,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [phase, setPhase] = useState('opening');
  const [direction, setDirection] = useState(1);
  const [viewportTick, setViewportTick] = useState(0);
  const [knownSizes, setKnownSizes] = useState(mediaSizes);
  const closeStartedRef = useRef(false);
  const selectedMedia = images[selectedIndex];
  const selectedSize = knownSizes[selectedIndex] || knownSizes[initialIndex];
  const targetRect = getContainRect(selectedSize, originRect);
  const isReturningToOrigin = phase === 'closing' && selectedIndex === initialIndex;

  useEffect(() => {
    onFocusIndexChange(selectedIndex);
  }, [onFocusIndexChange, selectedIndex]);

  const closeFocus = useCallback(() => {
    if (!closeStartedRef.current) {
      closeStartedRef.current = true;
      onCloseStart();
    }

    setPhase((currentPhase) => (currentPhase === 'closing' ? currentPhase : 'closing'));
  }, [onCloseStart]);

  const scrollPrev = useCallback(() => {
    if (phase === 'closing' || images.length <= 1) return;

    setDirection(-1);
    setPhase('open');
    setSelectedIndex((currentIndex) => (
      currentIndex === 0 ? images.length - 1 : currentIndex - 1
    ));
  }, [images.length, phase]);

  const scrollNext = useCallback(() => {
    if (phase === 'closing' || images.length <= 1) return;

    setDirection(1);
    setPhase('open');
    setSelectedIndex((currentIndex) => (
      currentIndex === images.length - 1 ? 0 : currentIndex + 1
    ));
  }, [images.length, phase]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeFocus();
      }

      if (event.key === 'ArrowLeft') {
        scrollPrev();
      }

      if (event.key === 'ArrowRight') {
        scrollNext();
      }
    };

    const handleResize = () => {
      setViewportTick((tick) => tick + 1);
    };

    document.body.classList.add('focus-open');
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    return () => {
      document.body.classList.remove('focus-open');
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [closeFocus, scrollNext, scrollPrev]);

  const handleImageLoad = (event) => {
    const size = getImageSize(event.currentTarget);
    if (!size) return;

    setKnownSizes((currentSizes) => ({
      ...currentSizes,
      [selectedIndex]: size,
    }));
  };

  const handleAnimationComplete = () => {
    if (phase === 'opening') {
      setPhase('open');
    }

    if (phase === 'closing') {
      onClosed();
    }
  };

  const openingInitial = {
    ...toMotionRect(originRect),
    x: 0,
    scale: 1,
    opacity: 1,
    clipPath: toClipPath(originClip),
  };

  const openInitial = {
    ...toMotionRect(targetRect),
    x: direction * 42,
    scale: 0.985,
    opacity: 0,
    clipPath: emptyClip,
  };

  const closedAnimation = isReturningToOrigin
    ? {
      ...toMotionRect(originRect),
      x: 0,
      scale: 1,
      opacity: 1,
      clipPath: toClipPath(originClip),
    }
    : {
      ...toMotionRect(targetRect),
      x: 0,
      scale: 0.96,
      opacity: 0,
      clipPath: emptyClip,
    };

  const activeAnimation = phase === 'closing'
    ? closedAnimation
    : {
      ...toMotionRect(targetRect),
      x: 0,
      scale: 1,
      opacity: 1,
      clipPath: emptyClip,
    };

  void viewportTick;

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none">
      <AnimatePresence custom={direction}>
        <motion.img
          key={`${selectedMedia.src}-${selectedIndex}`}
          src={selectedMedia.src}
          alt={selectedMedia.alt}
          className="fixed z-[205] select-none pointer-events-none"
          draggable="false"
          initial={phase === 'opening' ? openingInitial : openInitial}
          animate={activeAnimation}
          exit={{
            ...toMotionRect(targetRect),
            x: direction * -42,
            scale: 0.985,
            opacity: 0,
            clipPath: emptyClip,
            transition: { duration: 0.24, ease },
          }}
          transition={{
            left: { duration: 0.72, ease },
            top: { duration: 0.72, ease },
            width: { duration: 0.72, ease },
            height: { duration: 0.72, ease },
            clipPath: { duration: 0.68, ease },
            x: { duration: 0.28, ease },
            scale: { duration: 0.28, ease },
            opacity: { duration: 0.24, ease },
          }}
          onLoad={handleImageLoad}
          onAnimationComplete={handleAnimationComplete}
        />
      </AnimatePresence>

      <button
        type="button"
        onClick={closeFocus}
        className="absolute right-5 top-5 md:right-8 md:top-8 z-[220] w-12 h-12 flex items-center justify-center bg-white/85 hover:bg-white transition-colors pointer-events-auto"
        aria-label="Fechar modo foco"
      >
        <X size={24} strokeWidth={1} />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            className="absolute left-4 md:left-8 top-1/2 z-[220] -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/85 hover:bg-white transition-colors pointer-events-auto"
            aria-label="Imagem anterior"
          >
            <ChevronLeft size={28} strokeWidth={1} />
          </button>

          <button
            type="button"
            onClick={scrollNext}
            className="absolute right-4 md:right-8 top-1/2 z-[220] -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/85 hover:bg-white transition-colors pointer-events-auto"
            aria-label="Proxima imagem"
          >
            <ChevronRight size={28} strokeWidth={1} />
          </button>

          <div className="absolute bottom-5 right-5 md:bottom-8 md:right-8 z-[220] bg-white/85 px-3 py-1.5 pointer-events-none">
            <span className="font-inter text-[10px] font-light tracking-wider">
              {String(selectedIndex + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

const Carousel = ({ images, onFocusModeChange }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [focusState, setFocusState] = useState(null);
  const [hiddenPreviewIndex, setHiddenPreviewIndex] = useState(null);
  const imageRefs = useRef([]);
  const mediaSizesRef = useRef({});
  const focusTransitionLockRef = useRef(false);

  useEffect(() => () => {
    if (focusTransitionLockRef.current) {
      activeFocusTransition = false;
    }
  }, []);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const openFocus = useCallback((index) => {
    if (focusTransitionLockRef.current || activeFocusTransition) return;

    const imageElement = imageRefs.current[index];
    const previewElement = imageElement?.parentElement;
    if (!imageElement || !previewElement) return;

    const mediaSize = getImageSize(imageElement);
    if (!mediaSize) return;

    const previewRect = toPlainRect(previewElement.getBoundingClientRect());
    const originRect = getCoverImageRect(previewRect, mediaSize);
    const originClip = getClipInsets(originRect, previewRect);

    focusTransitionLockRef.current = true;
    activeFocusTransition = true;
    mediaSizesRef.current[index] = mediaSize;
    setHiddenPreviewIndex(index);
    onFocusModeChange?.(true);
    setFocusState({
      initialIndex: index,
      originRect,
      originClip,
      mediaSizes: { ...mediaSizesRef.current },
    });
  }, [onFocusModeChange]);

  const handleFocusCloseStart = useCallback(() => {
    onFocusModeChange?.(false);
  }, [onFocusModeChange]);

  const closeFocus = useCallback(() => {
    focusTransitionLockRef.current = false;
    activeFocusTransition = false;
    setFocusState(null);
    setHiddenPreviewIndex(null);
  }, []);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return undefined;

    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const storeImageRef = (index, node) => {
    imageRefs.current[index] = node;
    const mediaSize = getImageSize(node);
    if (mediaSize) {
      mediaSizesRef.current[index] = mediaSize;
    }
  };

  const handleImageLoad = (index, event) => {
    const mediaSize = getImageSize(event.currentTarget);
    if (mediaSize) {
      mediaSizesRef.current[index] = mediaSize;
    }
  };

  const renderFocusPortal = () => {
    if (!focusState || typeof document === 'undefined') return null;

    return createPortal(
      <FocusCarousel
        images={images}
        initialIndex={focusState.initialIndex}
        originRect={focusState.originRect}
        originClip={focusState.originClip}
        mediaSizes={focusState.mediaSizes}
        onFocusIndexChange={setHiddenPreviewIndex}
        onCloseStart={handleFocusCloseStart}
        onClosed={closeFocus}
      />,
      document.body,
    );
  };

  const renderMedia = (media, index) => {
    const isPreviewHidden = hiddenPreviewIndex === index;

    if (media?.type === 'video') {
      return (
        <video
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
      <button
        type="button"
        onClick={() => openFocus(index)}
        className={`block w-full h-full cursor-zoom-in overflow-hidden ${
          isPreviewHidden ? 'bg-transparent' : 'bg-stone'
        }`}
        aria-label={`Abrir imagem ${index + 1} em modo foco`}
      >
        <img
          ref={(node) => storeImageRef(index, node)}
          src={media.src}
          alt={media.alt}
          className={`w-full h-full object-cover ${
            isPreviewHidden ? 'bg-transparent opacity-0' : 'bg-stone opacity-100'
          }`}
          draggable="false"
          onLoad={(event) => handleImageLoad(index, event)}
        />
      </button>
    );
  };

  if (images.length === 1) {
    return (
      <>
        <div className={`relative w-full h-[480px] ${
          hiddenPreviewIndex === 0 ? 'bg-transparent' : 'bg-stone'
        }`}>
          {renderMedia(images[0], 0)}
        </div>

        {renderFocusPortal()}
      </>
    );
  }

  return (
    <>
      <div className="relative w-full h-[480px] group">
        <div className="overflow-hidden h-full" ref={emblaRef}>
          <div className="flex h-full">
            {images.map((image, index) => (
              <div key={`${image.src}-${index}`} className="flex-[0_0_100%] min-w-0 relative">
                {renderMedia(image, index)}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={scrollPrev}
          className="absolute left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 p-3 hover:bg-white"
          aria-label="Imagem anterior"
        >
          <ChevronLeft size={24} strokeWidth={1} />
        </button>

        <button
          type="button"
          onClick={scrollNext}
          className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 p-3 hover:bg-white"
          aria-label="Proxima imagem"
        >
          <ChevronRight size={24} strokeWidth={1} />
        </button>

        <div className="absolute bottom-4 right-4 bg-white/90 px-3 py-1.5">
          <span className="font-inter text-[10px] font-light tracking-wider">
            {String(selectedIndex + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
          </span>
        </div>
      </div>

      {renderFocusPortal()}
    </>
  );
};

export default Carousel;
