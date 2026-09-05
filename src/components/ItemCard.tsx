import React, { useState } from 'react';
import { doc, deleteDoc } from 'firebase/firestore';
import { Clock, Trash2, Tag as TagIcon, Copy, Check, Loader2 } from 'lucide-react';
import { db, handleFirestoreError } from '../lib/firebase';
import { OperationType, type Item } from '../types';
import { formatRelativeTime } from '../utils/textUtils';
import { DoodleSparkle } from './Doodles';

interface ItemCardProps {
  item: Item;
  uid: string;
  onTagClick?: (tag: string) => void;
}

const getTagBadgeStyle = (tag: string): string => {
  const lower = tag.toLowerCase();
  if (['work', 'project', 'client', 'career'].includes(lower)) {
    return 'text-[#83243A] bg-[#FCECEB] border-[#F2B3B8] hover:bg-[#F9D0D3]';
  }
  if (['personal', 'life', 'habit', 'health', 'mind'].includes(lower)) {
    return 'text-[#2D5A27] bg-[#F0F5ED] border-[#C8E0BF] hover:bg-[#E3EEDC]';
  }
  if (['finance', 'money', 'budget', 'tax'].includes(lower)) {
    return 'text-[#8C6D1F] bg-[#FDF6E2] border-[#EADAA2] hover:bg-[#F7EDC8]';
  }
  if (['dev', 'code', 'tech', 'software', 'ai'].includes(lower)) {
    return 'text-[#4A2B78] bg-[#EFEAF8] border-[#CFBEED] hover:bg-[#E4D8F5]';
  }
  return 'text-[#6B1D2F] bg-[#FDE8E9] border-[#F2B3B8] hover:bg-[#F9D0D3]';
};

export const ItemCard: React.FC<ItemCardProps> = ({ item, uid, onTagClick }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const createdAtDate = item.createdAt ? item.createdAt.toDate() : null;

  const handleDelete = async () => {
    const docPath = `users/${uid}/items/${item.id}`;
    try {
      setIsDeleting(true);
      await deleteDoc(doc(db, 'users', uid, 'items', item.id));
    } catch (err) {
      console.error('Delete failed:', err);
      handleFirestoreError(err, OperationType.DELETE, docPath);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      id={`item-card-${item.id}`}
      className="group bg-[#FFFDF9] p-6 rounded-3xl border border-[#6B1D2F]/15 shadow-scrapbook hover:shadow-scrapbook-md hover:-translate-y-0.5 transition-all flex flex-col justify-between relative"
    >
      <div>
        {/* Header: Badge/Category and Meta */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2">
            {item.tags && item.tags.length > 0 ? (
              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider border shadow-2xs ${getTagBadgeStyle(item.tags[0])}`}>
                {item.tags[0]}
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider bg-[#FAF2EB] text-[#83243A] border border-[#E5DDD0] shadow-2xs">
                Note
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#83243A]/50 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#83243A]/40" />
              {formatRelativeTime(createdAtDate)}
            </span>

            <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity ml-1">
              <button
                onClick={handleCopy}
                title="Copy thought"
                className="p-1 rounded-lg text-[#83243A]/60 hover:text-[#360B15] hover:bg-[#FDE8E9] transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#2D5A27]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                title="Delete thought"
                className="p-1 rounded-lg text-[#83243A]/60 hover:text-[#83243A] hover:bg-[#FFF5F5] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Summary (1-2 sentence core takeaway) */}
        {item.summary && (
          <div className="mb-3.5 p-3.5 rounded-2xl bg-[#FAF2EB]/75 border border-[#E5DDD0] group-hover:bg-[#FAF2EB] transition-colors">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#83243A] mb-1">
              <DoodleSparkle className="w-3 h-3 text-[#83243A]" />
              <span>Key Takeaway</span>
            </div>
            <p className="font-serif font-bold text-[#360B15] leading-snug text-sm sm:text-base tracking-tight">
              {item.summary}
            </p>
          </div>
        )}

        {/* Text Body */}
        <div className="text-[#541423]/80 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans break-words mb-3.5">
          {item.text}
        </div>
      </div>

      {/* Footer: All Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="mt-auto pt-3.5 border-t border-[#6B1D2F]/10 flex flex-wrap items-center gap-1.5">
          <TagIcon className="w-3 h-3 text-[#83243A]/40 shrink-0 mr-0.5" />
          {item.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onTagClick && onTagClick(tag)}
              className="text-xs bg-[#FAF7F2] text-[#541423] hover:bg-[#FDE8E9] hover:text-[#6B1D2F] px-2.5 py-0.5 rounded-md font-mono transition-colors cursor-pointer border border-[#6B1D2F]/10 shadow-2xs"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

