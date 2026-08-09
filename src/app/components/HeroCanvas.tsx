import { useEffect, useRef } from 'react';

interface MouseState {
  x: number;
  y: number;
  active: boolean;
}

const RADIUS = 260;

export function HeroCanvas({ mouseRef }: { mouseRef: React.RefObject<MouseState> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let rafId = 0;
    let lastX = -1;
    let lastY = -1;
    let lastActive = false;

    function resize() {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Redimensionar zera o bitmap: esquecemos o brilho anterior para que o
      // próximo frame o repinte na posição correta em vez de o perder.
      lastX = -1;
      lastY = -1;
      lastActive = false;
    }
    resize();
    window.addEventListener('resize', resize);

    // Só redesenhamos a caixa que o brilho realmente cobre (mais a anterior, para
    // apagá-la) em vez do canvas inteiro: durante o scroll o Chrome dispara
    // mousemove sintético para atualizar o :hover, então isso rodava a cada frame.
    function clearAround(x: number, y: number) {
      ctx.clearRect(x - RADIUS, y - RADIUS, RADIUS * 2, RADIUS * 2);
    }

    function draw() {
      const mouse = mouseRef.current;
      const active = !!mouse?.active;
      const moved = active && (mouse!.x !== lastX || mouse!.y !== lastY);

      if (active !== lastActive || moved) {
        if (lastX >= 0) clearAround(lastX, lastY);

        if (active) {
          const { x, y } = mouse!;
          const glow = ctx.createRadialGradient(x, y, 0, x, y, RADIUS);
          glow.addColorStop(0, 'rgba(255,255,255,0.10)');
          glow.addColorStop(0.5, 'rgba(6,182,212,0.05)');
          glow.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = glow;
          ctx.fillRect(x - RADIUS, y - RADIUS, RADIUS * 2, RADIUS * 2);
          lastX = x;
          lastY = y;
        } else {
          lastX = -1;
          lastY = -1;
        }
        lastActive = active;
      }

      rafId = requestAnimationFrame(draw);
    }

    // Enquanto o hero está fora da viewport não há nada para animar, então
    // paramos o loop por completo em vez de acordar a main thread a 60Hz.
    function start() {
      if (!rafId) rafId = requestAnimationFrame(draw);
    }
    function stop() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 },
    );
    observer.observe(container);

    return () => {
      observer.disconnect();
      stop();
      window.removeEventListener('resize', resize);
    };
  }, [mouseRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
      style={{ pointerEvents: 'none' }}
    />
  );
}
