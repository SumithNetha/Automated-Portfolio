import React from 'react';

interface BrandLogoProps {
  size?: number;
  className?: string;
  showLivePulse?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 32,
  className = '',
  showLivePulse = true,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-lg overflow-hidden shrink-0 transition-transform duration-200 group-hover:scale-105 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          <linearGradient id="brandBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E1E1C" />
            <stop offset="100%" stopColor="#0F0F0D" />
          </linearGradient>
          <filter id="brandGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#10B981" floodOpacity="0.7" />
          </filter>
        </defs>

        {/* Squircle Background Tile */}
        <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#brandBg)" stroke="#383632" strokeWidth="1.8" />

        {/* Geometric Monogram S */}
        <path
          d="M 28 23 C 28 19 25.5 17 21 17 C 16.5 17 14.5 19.5 14.5 23 C 14.5 28.5 28 27.5 28 35.5 C 28 39.5 25 42 20.5 42 C 16 42 14 38.5 14 35"
          stroke="#FAF9F5"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Geometric Monogram M */}
        <path
          d="M 34 42 V 17.5 L 42 30 L 50 17.5 V 42"
          stroke="#FAF9F5"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Live Status Pulse Dot */}
        {showLivePulse && (
          <>
            <circle cx="51" cy="13" r="3.2" fill="#10B981" filter="url(#brandGlow)" />
            <circle cx="51" cy="13" r="5.2" stroke="#10B981" strokeWidth="1" strokeOpacity="0.5" />
          </>
        )}
      </svg>
    </div>
  );
};
