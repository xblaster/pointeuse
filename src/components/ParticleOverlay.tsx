import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  /** Vertical speed in px/frame (negative = upward) */
  vy: number;
  opacity: number;
  radius: number;
}

interface ParticleOverlayProps {
  /** Hex color of the particles (e.g. '#4ADE80') */
  color: string;
}

const PARTICLE_COUNT = 8;

function parseHexColor(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

/**
 * Canvas-based particle overlay for the active session segment.
 * Renders 8 slow-moving particles (breathing effect) constrained
 * within the parent bounding box.
 */
export default function ParticleOverlay({ color }: ParticleOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const [r, g, b] = parseHexColor(color);

    const syncSize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    syncSize();

    const ro = new ResizeObserver(() => {
      syncSize();
      // Re-clamp existing particles to new bounds
      for (const p of particlesRef.current) {
        p.x = Math.min(p.x, canvas.width);
        p.y = Math.min(p.y, canvas.height);
      }
    });
    ro.observe(canvas);

    // Initialize particles spread across the canvas
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      x: ((i + 0.5) / PARTICLE_COUNT) * (canvas.width || 80),
      y: Math.random() * (canvas.height || 28),
      // Slow Y traversal: full height in 2–4 s at ~60 fps → 0.07–0.14 px/frame
      vy: (0.07 + Math.random() * 0.07) * (Math.random() < 0.5 ? 1 : -1),
      opacity: 0.2 + Math.random() * 0.3,
      radius: 1.5 + Math.random(),
    }));

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, w, h);

      for (const p of particlesRef.current) {
        p.y += p.vy;
        // Wrap vertically
        if (p.y < -p.radius) p.y = h + p.radius;
        if (p.y > h + p.radius) p.y = -p.radius;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.opacity})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderRadius: '9999px',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    />
  );
}
