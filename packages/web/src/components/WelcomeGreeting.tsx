import { useEffect, useState } from 'react';

interface Props {
  firstName: string;
  lastName: string;
  onDone: () => void;
}

const DURATION = 5000;

export function WelcomeGreeting({ firstName, lastName, onDone }: Props) {
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = 50;
    let elapsed = 0;

    const ticker = setInterval(() => {
      elapsed += interval;
      setProgress(Math.min((elapsed / DURATION) * 100, 100));
    }, interval);

    const fadeTimer = setTimeout(() => setFading(true), DURATION - 600);
    const doneTimer = setTimeout(onDone, DURATION);

    return () => {
      clearInterval(ticker);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-brand-gradient"
      style={{
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.6s ease',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* Contenu centré */}
      <div className="flex flex-col items-center select-none splash-content">
        {/* Logo RC */}
        <div className="w-20 h-20 rounded-2xl overflow-hidden mb-8 shadow-xl ring-4 ring-white/20">
          <img
            src="/logo-rc-dark.jpg"
            alt="Raly Conseils"
            className="w-full h-full object-cover"
          />
        </div>

        <p className="text-white/75 text-sm font-light tracking-brand-widest uppercase mb-4">
          Bienvenue
        </p>

        <h1 className="text-5xl font-bold text-white text-center drop-shadow tracking-brand-h3">
          {firstName}
          {lastName ? ` ${lastName}` : ''}
        </h1>

        <p className="text-white/70 mt-5 text-base font-light">
          Bonnes analyses&nbsp;📊
        </p>
      </div>

      {/* Barre de progression */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 overflow-hidden">
        <div
          className="h-full bg-white/55"
          style={{ width: `${progress}%`, transition: `width ${50}ms linear` }}
        />
      </div>
    </div>
  );
}
