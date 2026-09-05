import React from 'react';

// Hand-drawn starburst / editorial sparkle
export const DoodleSparkle: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
  </svg>
);

// Whimsical 4-point hand-drawn twinkle star
export const DoodleStar: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M10 1L12.3 7.6L19 10L12.3 12.4L10 19L7.7 12.4L1 10L7.7 7.6L10 1Z" />
  </svg>
);

// Playful hand-drawn curly swirl / scribble
export const DoodleScribble: React.FC<{ className?: string }> = ({ className = 'w-16 h-4' }) => (
  <svg
    viewBox="0 0 120 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M3 14C24 4 45 15 66 8C85 2 102 14 117 7" />
  </svg>
);

// Scallop ribbon border divider (repeating organic waves)
export const ScallopDivider: React.FC<{ className?: string; inverted?: boolean }> = ({
  className = 'w-full h-3 text-[#6B1D2F]/20',
  inverted = false,
}) => (
  <div className={`overflow-hidden leading-none select-none ${className}`}>
    <svg
      viewBox="0 0 1200 12"
      fill="currentColor"
      preserveAspectRatio="none"
      className={`w-full h-full ${inverted ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <path d="M0,0 C30,10 45,10 75,0 C105,10 120,10 150,0 C180,10 195,10 225,0 C255,10 270,10 300,0 C330,10 345,10 375,0 C405,10 420,10 450,0 C480,10 495,10 525,0 C555,10 570,10 600,0 C630,10 645,10 675,0 C705,10 720,10 750,0 C780,10 795,10 825,0 C855,10 870,10 900,0 C930,10 945,10 975,0 C1005,10 1020,10 1050,0 C1080,10 1095,10 1125,0 C1155,10 1170,10 1200,0 L1200,12 L0,12 Z" />
    </svg>
  </div>
);

// Tactile Washi Tape Strip
export const WashiTape: React.FC<{
  color?: 'blush' | 'lavender' | 'burgundy' | 'cream';
  className?: string;
  rotate?: string;
}> = ({ color = 'blush', className = '', rotate = '-rotate-1' }) => {
  const bgColors = {
    blush: 'bg-[#F9D0D3]/80 border-t border-b border-[#F2B3B8]/60 text-[#83243A]',
    lavender: 'bg-[#E4D8F5]/80 border-t border-b border-[#CFBEED]/60 text-[#541423]',
    burgundy: 'bg-[#6B1D2F]/20 border-t border-b border-[#6B1D2F]/30 text-[#6B1D2F]',
    cream: 'bg-[#F5EFE4]/90 border-t border-b border-[#ECE2D0] text-[#6B1D2F]',
  };

  return (
    <div
      className={`absolute h-4 sm:h-5 w-16 sm:w-20 shadow-xs pointer-events-none z-10 opacity-90 backdrop-blur-[0.5px] ${bgColors[color]} ${rotate} ${className}`}
      style={{
        clipPath: 'polygon(0% 0%, 96% 2%, 100% 98%, 4% 100%)',
      }}
      aria-hidden="true"
    />
  );
};

// Hand-drawn little flower / rosette
export const DoodleFlower: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 8.5C10.07 8.5 8.5 10.07 8.5 12C8.5 13.93 10.07 15.5 12 15.5C13.93 15.5 15.5 13.93 15.5 12C15.5 10.07 13.93 8.5 12 8.5ZM12 2C10.9 2 10 2.9 10 4C10 4.6 10.27 5.13 10.69 5.5C10.45 5.86 10.25 6.25 10.09 6.66C9.56 6.3 8.9 6.09 8.2 6.09C6.98 6.09 6 7.07 6 8.29C6 8.92 6.26 9.49 6.68 9.9C6.35 10.3 6.1 10.74 5.92 11.23C5.39 10.92 4.77 10.74 4.11 10.74C2.94 10.74 2 11.68 2 12.85C2 13.94 2.82 14.83 3.88 14.95C4.07 15.46 4.34 15.93 4.68 16.34C4.33 16.74 4.11 17.27 4.11 17.85C4.11 19.04 5.07 20 6.26 20C7.03 20 7.7 19.6 8.08 19C8.5 19.26 8.96 19.46 9.45 19.59C9.44 19.72 9.43 19.86 9.43 20C9.43 21.1 10.33 22 11.43 22C12.53 22 13.43 21.1 13.43 20C13.43 19.86 13.42 19.72 13.41 19.59C13.9 19.46 14.36 19.26 14.78 19C15.16 19.6 15.83 20 16.6 20C17.79 20 18.75 19.04 18.75 17.85C18.75 17.27 18.53 16.74 18.18 16.34C18.52 15.93 18.79 15.46 18.98 14.95C20.04 14.83 20.86 13.94 20.86 12.85C20.86 11.68 19.92 10.74 18.75 10.74C18.09 10.74 17.47 10.92 16.94 11.23C16.76 10.74 16.51 10.3 16.18 9.9C16.6 9.49 16.86 8.92 16.86 8.29C16.86 7.07 15.88 6.09 14.66 6.09C13.96 6.09 13.3 6.3 12.77 6.66C12.61 6.25 12.41 5.86 12.17 5.5C12.59 5.13 12.86 4.6 12.86 4C12.86 2.9 11.96 2 10.86 2H12Z" />
  </svg>
);
