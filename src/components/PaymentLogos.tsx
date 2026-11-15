import React from 'react';

export function MtnMomoLogo({ className = 'h-9 w-auto' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 44"
      className={className}
      role="img"
      aria-label="MTN MoMo"
    >
      <rect width="120" height="44" rx="8" fill="#FFCC00" />
      <ellipse cx="30" cy="22" rx="22" ry="13" fill="#071426" />
      <text
        x="30"
        y="25.5"
        textAnchor="middle"
        fill="#FFCC00"
        fontSize="10"
        fontWeight="800"
        fontFamily="DM Sans, sans-serif"
      >
        MTN
      </text>
      <text
        x="84"
        y="26"
        textAnchor="middle"
        fill="#071426"
        fontSize="13"
        fontWeight="800"
        fontFamily="DM Sans, sans-serif"
      >
        MoMo
      </text>
    </svg>
  );
}

export function OrangeMoneyLogo({ className = 'h-9 w-auto' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 132 44"
      className={className}
      role="img"
      aria-label="Orange Money"
    >
      <rect width="132" height="44" rx="8" fill="#111827" />
      <rect x="8" y="8" width="28" height="28" rx="4" fill="#FF7900" />
      <text
        x="22"
        y="31"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="8.5"
        fontWeight="700"
        fontFamily="DM Sans, sans-serif"
      >
        OM
      </text>
      <text
        x="82"
        y="19"
        textAnchor="middle"
        fill="#FF7900"
        fontSize="10"
        fontWeight="700"
        fontFamily="DM Sans, sans-serif"
      >
        Orange
      </text>
      <text
        x="82"
        y="32"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="10.5"
        fontWeight="700"
        fontFamily="DM Sans, sans-serif"
      >
        Money
      </text>
    </svg>
  );
}

export function VisaMastercardLogo({ className = 'h-9 w-auto' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 144 44"
      className={className}
      role="img"
      aria-label="Visa and Mastercard"
    >
      <rect width="144" height="44" rx="8" fill="#071426" />
      {/* VISA wordmark */}
      <text
        x="34"
        y="27"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="15"
        fontWeight="800"
        fontStyle="italic"
        letterSpacing="0.8"
        fontFamily="DM Sans, sans-serif"
      >
        VISA
      </text>
      <line x1="68" y1="10" x2="68" y2="34" stroke="#334155" strokeWidth="1.5" />
      {/* Mastercard overlapping circles */}
      <circle cx="96" cy="22" r="11" fill="#EB001B" />
      <circle cx="112" cy="22" r="11" fill="#F79E1B" fillOpacity="0.9" />
    </svg>
  );
}
