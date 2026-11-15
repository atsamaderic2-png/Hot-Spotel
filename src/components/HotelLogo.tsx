import React from 'react';

interface HotelLogoProps {
  variant?: 'light' | 'dark';
  showWordmark?: boolean;
  className?: string;
}

export function HotelLogo({
  variant = 'light',
  showWordmark = true,
  className = '',
}: HotelLogoProps) {
  const isLight = variant === 'light';

  return (
    <span className={`inline-flex items-center gap-3 whitespace-nowrap shrink-0 ${className}`}>
      <svg
        viewBox="0 0 44 44"
        className="w-10 h-10 shrink-0"
        role="img"
        aria-label="hotel Spot Crest"
      >
        {/* Outer Architectural Octagonal Crest */}
        <polygon
          points="14,2 30,2 42,14 42,30 30,42 14,42 2,30 2,14"
          fill={isLight ? 'var(--theme-elevated)' : 'var(--theme-primary)'}
          stroke="var(--theme-accent)"
          strokeWidth="1.75"
        />
        {/* Fine Inner Hairline Frame */}
        <polygon
          points="15.5,5.2 28.5,5.2 38.8,15.5 38.8,28.5 28.5,38.8 15.5,38.8 5.2,28.5 5.2,15.5"
          fill="none"
          stroke="var(--theme-accent)"
          strokeOpacity="0.45"
          strokeWidth="0.9"
        />
        {/* Luxury Pinpoint Diamond Crown */}
        <polygon points="22,9.5 24.4,12.5 22,15.5 19.6,12.5" fill="var(--theme-accent)" />
        {/* Monogram: Architectural h + S Pillars */}
        <path
          d="M14 31V18.5M14 24.5C14 22.4 16 21 18.2 21C20.2 21 21.4 22.3 21.4 24.4V31"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M30.2 21.6C29.4 20.6 28 20.1 26.5 20.3C24.8 20.5 23.8 21.6 23.9 22.9C24 24.3 25.5 24.8 27.3 25.3C29.2 25.8 30.6 26.5 30.6 28.2C30.6 29.9 29.1 31.1 27 31.1C25.3 31.1 24 30.4 23.3 29.4"
          fill="none"
          stroke="var(--theme-accent)"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        {/* Base Horizon Rule */}
        <line
          x1="12.5"
          y1="34.5"
          x2="31.5"
          y2="34.5"
          stroke="var(--theme-accent)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>

      {showWordmark && (
        <span className="inline-flex items-baseline gap-1.5 font-display text-2xl sm:text-[1.65rem] tracking-tight leading-none">
          <span className={`font-semibold ${isLight ? 'text-white' : 'text-brand-primary'}`}>
            hotel
          </span>
          <span
            className={`font-bold italic ${
              isLight ? 'text-brand-accent' : 'text-brand-wordmark'
            }`}
          >
            Spot
          </span>
        </span>
      )}
    </span>
  );
}
