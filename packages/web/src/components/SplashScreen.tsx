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
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-brand-gradient"
      style={{
        transition: 'opacity 0.6s ease',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <div className="splash-content flex flex-col items-center select-none">
        {/* Logo RC */}
        <div className="w-24 h-24 rounded-2xl overflow-hidden mb-6 shadow-xl ring-4 ring-white/20">
          <img
            src="/logo-rc-dark.jpg"
            alt="Raly Conseils"
            className="w-full h-full object-cover"
          />
        </div>

        <h1 className="text-7xl font-bold text-white drop-shadow tracking-brand-title">
          Finloop
        </h1>

        <p className="text-white/70 text-sm mt-3 tracking-brand-wider uppercase font-light">
          Analyse financière
        </p>

        <p className="text-white/50 text-xs mt-1.5 tracking-brand-wide font-light">
          par Raly Conseils
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
