import { useId } from 'react';

interface Props {
  size?: number;
  variant?: 'gradient' | 'white' | 'orange';
  className?: string;
}

const PATH = 'M 8 27 C 8 16 17 7 27 7 C 37 7 45 16 45 27 C 45 38 53 47 63 47 C 73 47 82 38 82 27 C 82 16 73 7 63 7 C 53 7 45 16 45 27 C 45 38 37 47 27 47 C 17 47 8 38 8 27 Z';

export function FinloopLogo({ size = 48, variant = 'gradient', className = '' }: Props) {
  const uid = useId();
  const gradId = `fl-grad-${uid.replace(/:/g, '')}`;

  const strokeColor =
    variant === 'white'  ? 'white'    :
    variant === 'orange' ? '#ff6d2d'  :
    `url(#${gradId})`;

  return (
    <svg
      width={size}
      height={Math.round(size * 0.6)}
      viewBox="0 0 90 54"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {variant === 'gradient' && (
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#f94f1c" />
            <stop offset="55%"  stopColor="#ff6d2d" />
            <stop offset="100%" stopColor="#ffa647" />
          </linearGradient>
        </defs>
      )}
      <path
        d={PATH}
        stroke={strokeColor}
        strokeWidth="5.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
