import React from 'react';

const MOTIFS = ['✦', '✺', '✿', '✧', '★'];

const ITEMS = [
  { text: 'CAPTURE THOUGHTS', italic: false },
  { text: 'deep recall', italic: true },
  { text: 'ACTIVE SYNTHESIS', italic: false },
  { text: 'ephemeral & timeless', italic: true },
  { text: 'INTELLECTUAL VAULT', italic: false },
  { text: 'ideas resurfacing', italic: true },
  { text: 'INSTANT CLARITY', italic: false },
  { text: 'living scrapbook', italic: true },
];

export const MarqueeStrip: React.FC = () => {
  return (
    <div
      id="kinetic-marquee-strip"
      className="w-full bg-[#360B15] text-[#FDE8E9] border-y border-[#541423] overflow-hidden py-2 select-none relative z-20 shadow-xs"
    >
      <div className="flex animate-marquee whitespace-nowrap text-[11px] sm:text-xs tracking-[0.2em] uppercase items-center">
        {[...Array(4)].map((_, groupIndex) => (
          <div key={groupIndex} className="flex items-center">
            {ITEMS.map((item, i) => (
              <React.Fragment key={`${groupIndex}-${i}`}>
                <span
                  className={`mx-3 sm:mx-4 ${
                    item.italic
                      ? 'font-serif lowercase italic text-[#F9D0D3] tracking-normal text-xs sm:text-sm font-medium'
                      : 'font-mono font-bold text-[#FCFAF6]'
                  }`}
                >
                  {item.text}
                </span>
                <span className="text-[#83243A] text-[9px] select-none">
                  {MOTIFS[i % MOTIFS.length]}
                </span>
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

