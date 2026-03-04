import { useEffect, useState } from 'react';

interface Props {
  onDone: () => void;
}

export function SplashScreen({ onDone }: Props) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 2500);
    const t2 = setTimeout(onDone, 3100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #f94f1c 0%, #ff6d2d 55%, #ffa647 100%)',
        transition: 'opacity 0.6s ease',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <div className="splash-content flex flex-col items-center select-none">
        {/* Symbole infini */}
        <svg width="96" height="58" viewBox="0 0 90 54" fill="none" className="mb-6 drop-shadow-lg">
          <path
            d="M 8 27 C 8 16 17 7 27 7 C 37 7 45 16 45 27 C 45 38 53 47 63 47 C 73 47 82 38 82 27 C 82 16 73 7 63 7 C 53 7 45 16 45 27 C 45 38 37 47 27 47 C 17 47 8 38 8 27 Z"
            stroke="white"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>

        <h1
          className="text-7xl font-bold text-white drop-shadow"
          style={{ letterSpacing: '-2px', fontFamily: '"Segoe UI", system-ui, sans-serif' }}
        >
          Finloop
        </h1>

        <p className="text-white/70 text-sm mt-3 tracking-[0.35em] uppercase font-light">
          Analyse financière
        </p>
      </div>

      {/* Points de chargement */}
      <div className="absolute bottom-14 flex gap-2.5">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-white/60 splash-dot"
            style={{ animationDelay: `${i * 0.22}s` }}
          />
        ))}
      </div>
    </div>
  );
}
