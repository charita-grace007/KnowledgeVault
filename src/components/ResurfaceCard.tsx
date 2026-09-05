import React from 'react';
import { motion } from 'motion/react';
import { X, Tag as TagIcon, Clock, CornerDownRight } from 'lucide-react';
import type { ResurfaceResult } from '../utils/resurface';
import { BANNED_LITERAL_WORDS } from '../utils/resurface';
import { formatRelativeTime } from '../utils/textUtils';
import { WashiTape, DoodleSparkle } from './Doodles';

interface ResurfaceCardProps {
  resurface: ResurfaceResult;
  onDismiss: () => void;
  onInsertReference?: (textToAppend: string) => void;
}

export const ResurfaceCard: React.FC<ResurfaceCardProps> = ({
  resurface,
  onDismiss,
  onInsertReference,
}) => {
  const { item, matchedTags, matchedKeywords, thematicOverlap } = resurface;
  const createdAtDate = item.createdAt?.toDate ? item.createdAt.toDate() : null;

  const rawLabels = (thematicOverlap && thematicOverlap.length > 0)
    ? thematicOverlap
    : (matchedTags.length > 0
        ? matchedTags
        : matchedKeywords);

  const displayLabels = rawLabels
    .filter((l) => !BANNED_LITERAL_WORDS.has(l.toLowerCase().replace(/^#/, '')))
    .slice(0, 3);

  const handleAppend = () => {
    if (onInsertReference) {
      const citeText = `\n\n[Related: "${item.summary}"]`;
      onInsertReference(citeText);
    }
  };

  return (
    <motion.div
      id="resurface-card"
      layout
      initial={{ opacity: 0, y: -14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97, transition: { duration: 0.2 } }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="w-full mb-4 rounded-2xl bg-[#FCF8FB] border-2 border-[#CFBEED] p-4 sm:p-5 shadow-scrapbook relative overflow-hidden backdrop-blur-xs"
    >
      {/* Decorative Washi Tape Accent */}
      <WashiTape color="lavender" className="-top-2 left-6" rotate="-rotate-2" />

      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#541423] text-[#FCFAF6] shadow-xs">
            <DoodleSparkle className="w-3.5 h-3.5 text-[#F9D0D3]" />
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase">
              Resurface
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-serif font-bold tracking-tight text-[#360B15]">
            A related memory from your vault
          </h3>

          {createdAtDate && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-[#83243A]/60">
              <Clock className="w-3 h-3 text-[#83243A]/50" />
              {formatRelativeTime(createdAtDate)}
            </span>
          )}
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss suggestion"
          title="Dismiss suggestion"
          className="text-[#83243A]/60 hover:text-[#360B15] p-1 rounded-lg hover:bg-[#F9D0D3]/30 transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Resurfaced Summary */}
      <div className="pl-3 sm:pl-3.5 border-l-2 border-[#83243A] my-2.5 bg-[#FAF2EB]/40 py-1.5 rounded-r-lg">
        <p className="text-xs sm:text-sm font-serif font-bold text-[#360B15] leading-snug tracking-tight">
          {item.summary}
        </p>
        {item.text && item.text !== item.summary && (
          <p className="text-[11px] sm:text-xs text-[#6B1D2F]/75 mt-1 line-clamp-2 leading-relaxed font-sans">
            {item.text}
          </p>
        )}
      </div>

      {/* Matching overlap metadata & quick action */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 mt-2 border-t border-[#6B1D2F]/10">
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs">
          <span className="text-[#83243A]/80 font-mono font-medium">Thematic connection:</span>
          {displayLabels.length > 0 ? (
            displayLabels.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FFFDF9] text-[#6B1D2F] border border-[#CFBEED] font-mono font-semibold shadow-2xs"
              >
                <TagIcon className="w-2.5 h-2.5 text-[#83243A] shrink-0" />
                {label.startsWith('#') ? label : `#${label}`}
              </span>
            ))
          ) : (
            <span className="text-[#83243A]/50 italic font-mono">conceptual overlap</span>
          )}
        </div>

        {onInsertReference && (
          <button
            type="button"
            onClick={handleAppend}
            className="inline-flex items-center gap-1 text-[11px] font-serif font-semibold text-[#6B1D2F] hover:text-[#360B15] bg-[#FFFDF9] hover:bg-[#FDE8E9]/60 px-3 py-1 rounded-lg border border-[#83243A]/30 transition-all shadow-2xs hover:shadow-xs active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer"
          >
            <CornerDownRight className="w-3 h-3 text-[#83243A]" />
            <span>Connect to current thought</span>
          </button>
        )}
      </div>
    </motion.div>
  );
};

