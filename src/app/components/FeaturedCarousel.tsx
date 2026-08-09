import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CarouselApi } from './ui/carousel';
import { Carousel, CarouselContent, CarouselItem } from './ui/carousel';
import { Book } from '../data/catalog';
import { BookCard } from './BookCard';

interface FeaturedCarouselProps {
  books: Book[];
}

const AUTOPLAY_DELAY = 4000;

const navButtonStyle = {
  position: 'absolute' as const,
  top: '50%',
  transform: 'translateY(-50%)',
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  background: 'rgba(15,24,41,0.9)',
  border: '1px solid #1e2d4a',
  color: '#94a3b8',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10,
  transition: 'border-color 0.2s, color 0.2s',
  backdropFilter: 'blur(4px)',
};

export function FeaturedCarousel({ books }: FeaturedCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const stopAutoplay = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startAutoplay = useCallback(() => {
    stopAutoplay();
    timerRef.current = setInterval(() => {
      api?.scrollNext();
    }, AUTOPLAY_DELAY);
  }, [api, stopAutoplay]);

  // O autoplay anima transforms a cada 4s. Rodar isso com o carrossel fora da
  // viewport, com o mouse em cima, ou com a aba em segundo plano só gasta
  // frames sem ninguém ver (ou pior, briga com o usuário tentando navegar).
  useEffect(() => {
    if (!api || !rootRef.current) return;

    let visible = false;
    let hovering = false;
    const sync = () => (visible && !hovering && !document.hidden ? startAutoplay() : stopAutoplay());

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0 },
    );
    observer.observe(rootRef.current);
    document.addEventListener('visibilitychange', sync);
    api.on('pointerDown', stopAutoplay);

    const el = rootRef.current;
    const onEnter = () => { hovering = true; sync(); };
    const onLeave = () => { hovering = false; sync(); };
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      stopAutoplay();
      api.off('pointerDown', stopAutoplay);
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [api, startAutoplay, stopAutoplay]);

  function hoverOn(e: React.MouseEvent) {
    (e.currentTarget as HTMLElement).style.borderColor = '#06b6d4';
    (e.currentTarget as HTMLElement).style.color = '#06b6d4';
  }
  function hoverOff(e: React.MouseEvent) {
    (e.currentTarget as HTMLElement).style.borderColor = '#1e2d4a';
    (e.currentTarget as HTMLElement).style.color = '#94a3b8';
  }

  return (
    <div ref={rootRef}>
      <Carousel setApi={setApi} opts={{ loop: true, align: 'start' }}>
        {/* Setas dentro da moldura do carrossel, não fora dela. */}
        <button
          onClick={() => { stopAutoplay(); api?.scrollPrev(); }}
          aria-label="Slide anterior"
          style={{ ...navButtonStyle, left: '0.5rem' }}
          onMouseEnter={hoverOn}
          onMouseLeave={hoverOff}
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => { stopAutoplay(); api?.scrollNext(); }}
          aria-label="Próximo slide"
          style={{ ...navButtonStyle, right: '0.5rem' }}
          onMouseEnter={hoverOn}
          onMouseLeave={hoverOff}
        >
          <ChevronRight size={18} />
        </button>

        <CarouselContent>
          {books.map((book) => (
            <CarouselItem key={book.id} className="basis-1/2 sm:basis-1/3 lg:basis-1/5">
              <BookCard book={book} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
