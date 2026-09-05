import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Sparkles, Plus, X, Loader2, CornerDownLeft, Tag as TagIcon, AlignLeft } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { db, auth, handleFirestoreError } from '../lib/firebase';
import { OperationType, type Item } from '../types';
import { generateAutoSummary, extractHashtags } from '../utils/textUtils';
import { findResurfacedItem, extractConceptualTags, BANNED_LITERAL_WORDS, type ResurfaceResult } from '../utils/resurface';
import { ResurfaceCard } from './ResurfaceCard';
import { WashiTape, DoodleSparkle } from './Doodles';

interface ThoughtInputProps {
  uid: string;
  pastItems?: Item[];
  onItemSaved?: () => void;
}

export const ThoughtInput: React.FC<ThoughtInputProps> = ({ uid, pastItems = [], onItemSaved }) => {
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isCustomSummary, setIsCustomSummary] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resurfaced memory state
  const [resurfacedResult, setResurfacedResult] = useState<ResurfaceResult | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  // Client-side AI throttling & caching refs to respect free-tier quotas
  const lastAiCallTimeRef = useRef<number>(0);
  const aiCacheRef = useRef<Map<string, ResurfaceResult | null>>(new Map());

  // 1. Fast, responsive synchronization for Live Summary, inline hashtags, and local memory recall (300ms debounce)
  useEffect(() => {
    const clean = text.trim();
    if (!clean) {
      if (!isCustomSummary) setSummary('');
      setResurfacedResult(null);
      setDismissedId(null);
      return;
    }

    const timer = setTimeout(() => {
      // Live Summary generation on debounce
      if (!isCustomSummary) {
        setSummary(generateAutoSummary(clean));
      }

      // Extract inline hashtags into draft tags (filtering out shallow literal words)
      const extracted = extractHashtags(clean).filter((t) => !BANNED_LITERAL_WORDS.has(t.toLowerCase()));
      if (extracted.length > 0) {
        setTags((prev) => Array.from(new Set([...prev, ...extracted])));
      }

      // Fast local check: tag overlap, stemming, and topic clusters (instant, zero network latency)
      if (clean.length < 3 || !pastItems || pastItems.length === 0) {
        setResurfacedResult(null);
        return;
      }

      const localMatch = findResurfacedItem(clean, pastItems, tags);
      if (localMatch && localMatch.item.id !== dismissedId) {
        setResurfacedResult(localMatch);
      } else if (!localMatch) {
        // If there is no local match and previously held a local result (score < 100), clear it
        setResurfacedResult((prev) => (prev && prev.score >= 100 ? prev : null));
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [text, isCustomSummary, pastItems, tags, dismissedId]);

  // 2. Deep semantic recall via Gemini backend: runs when typing pauses (800ms) to detect conceptual/topical links
  useEffect(() => {
    const clean = text.trim();

    // Only run semantic AI check on substantive thoughts (at least 20 characters)
    if (clean.length < 20 || !pastItems || pastItems.length === 0) {
      return;
    }

    // Only skip if local matching already found an exact multi-tag match (>= 2 matching tags)
    const localMatch = findResurfacedItem(clean, pastItems, tags);
    if (localMatch && localMatch.item.id !== dismissedId && localMatch.matchedTags.length >= 2) {
      return;
    }

    // Check client-side throttle (minimum 2.5s between AI calls)
    const now = Date.now();
    if (now - lastAiCallTimeRef.current < 2500) {
      return;
    }

    // Check client cache
    const cacheKey = clean.toLowerCase().slice(0, 100);
    if (aiCacheRef.current.has(cacheKey)) {
      const cached = aiCacheRef.current.get(cacheKey);
      if (cached && cached.item.id !== dismissedId) {
        setResurfacedResult(cached);
      }
      return;
    }

    const abortController = new AbortController();

    const aiTimer = setTimeout(async () => {
      try {
        lastAiCallTimeRef.current = Date.now();
        const idToken = await auth.currentUser?.getIdToken();
        const candidatePayload = pastItems.slice(0, 15).map((item) => ({
          id: item.id,
          summary: item.summary,
          tags: item.tags,
          text: item.text.slice(0, 200),
        }));

        const res = await fetch('/api/gemini/resurface', {
          method: 'POST',
          signal: abortController.signal,
          headers: {
            'Content-Type': 'application/json',
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify({
            text: clean,
            candidates: candidatePayload,
          }),
        });

        if (res.ok) {
          const data = await res.json();

          if (data.matchId && data.matchId !== dismissedId) {
            const aiMatchedItem = pastItems.find((p) => p.id === data.matchId);
            if (aiMatchedItem) {
              const resultObj: ResurfaceResult = {
                item: aiMatchedItem,
                score: 100,
                matchedTags: [],
                matchedKeywords: [],
                thematicOverlap: Array.isArray(data.thematicOverlap) && data.thematicOverlap.length > 0
                  ? data.thematicOverlap
                  : (aiMatchedItem.tags || []).filter((t: string) => !BANNED_LITERAL_WORDS.has(t.toLowerCase())).slice(0, 3),
                explanation: data.explanation || undefined,
              };
              aiCacheRef.current.set(cacheKey, resultObj);
              setResurfacedResult(resultObj);
              return;
            }
          }
          // Negative result cached to prevent repeated querying on same draft
          aiCacheRef.current.set(cacheKey, null);
        }
      } catch (aiErr: any) {
        // Silently handle aborts or network interruptions
      }
    }, 800);

    return () => {
      clearTimeout(aiTimer);
      abortController.abort();
    };
  }, [text, pastItems, tags, dismissedId]);

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (!clean) return;
    if (tags.includes(clean)) {
      setTagInput('');
      return;
    }
    if (tags.length >= 20) {
      setError('Maximum 20 tags permitted.');
      return;
    }
    if (clean.length > 50) {
      setError('Tag must be under 50 characters.');
      return;
    }
    setTags((prev) => [...prev, clean]);
    setTagInput('');
    setError(null);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = text.trim();
    if (!cleanText) {
      setError("Please write something first.");
      return;
    }
    if (cleanText.length > 10000) {
      setError("Text is too long (maximum 10,000 characters).");
      return;
    }

    const targetPath = `users/${uid}/items`;

    try {
      setSaving(true);
      setError(null);

      let finalSummary = summary.trim();
      let cleanInputTags = tags
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 2 && !BANNED_LITERAL_WORDS.has(t));
      let finalTags = [...cleanInputTags];

      // Call Gemini backend to generate a 1-2 sentence summary and conceptual tags
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const response = await fetch('/api/gemini/summarize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify({ text: cleanText }),
        });

        if (response.ok) {
          const geminiData = await response.json();
          if (!isCustomSummary && geminiData.summary) {
            finalSummary = geminiData.summary;
          }
          if (Array.isArray(geminiData.tags) && geminiData.tags.length > 0) {
            const cleanGeminiTags = geminiData.tags
              .map((t: string) => String(t).trim().toLowerCase().replace(/^#/, ''))
              .filter((t: string) => t.length > 2 && !BANNED_LITERAL_WORDS.has(t));
            finalTags = Array.from(new Set([...finalTags, ...cleanGeminiTags])).slice(0, 20);
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini summarize service warning:', geminiErr);
      }

      // Fallbacks if not set
      if (!finalSummary) {
        finalSummary = generateAutoSummary(cleanText);
      }
      if (finalTags.length === 0) {
        finalTags = extractConceptualTags(cleanText);
      }

      // Save to Firestore
      await addDoc(collection(db, 'users', uid, 'items'), {
        text: cleanText,
        summary: finalSummary.slice(0, 1000),
        tags: finalTags.slice(0, 20),
        createdAt: serverTimestamp(),
      });

      // Reset form
      setText('');
      setSummary('');
      setTags([]);
      setTagInput('');
      setIsCustomSummary(false);
      setShowDetails(false);
      setResurfacedResult(null);
      setDismissedId(null);
      if (onItemSaved) onItemSaved();
    } catch (err) {
      console.error('Failed to save item:', err);
      handleFirestoreError(err, OperationType.CREATE, targetPath);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-10 px-4">
      {/* Resurface Card: "This might be useful right now" displayed above the input */}
      <AnimatePresence mode="wait">
        {resurfacedResult && (
          <ResurfaceCard
            key={resurfacedResult.item.id}
            resurface={resurfacedResult}
            onDismiss={() => {
              setDismissedId(resurfacedResult.item.id);
              setResurfacedResult(null);
            }}
            onInsertReference={(referenceText) => {
              setText((prev) => `${prev.trim()}${referenceText}`);
              setDismissedId(resurfacedResult.item.id);
              setResurfacedResult(null);
            }}
          />
        )}
      </AnimatePresence>

      <form
        id="thought-input-form"
        onSubmit={handleSubmit}
        className="relative bg-[#FFFDF9] rounded-3xl border-2 border-[#6B1D2F]/15 shadow-scrapbook-md p-5 sm:p-7 transition-all focus-within:border-[#83243A]/40 focus-within:shadow-scrapbook-lg"
      >
        {/* Playful Washi Tape Accent */}
        <WashiTape color="blush" className="-top-2.5 right-8" rotate="rotate-2" />

        {/* Label */}
        <div className="flex items-center justify-between mb-3">
          <label
            htmlFor="thought-textarea"
            className="text-xl sm:text-2xl font-serif text-[#360B15] flex items-center gap-2.5 font-bold tracking-tight"
          >
            <DoodleSparkle className="w-4 h-4 text-[#83243A]" />
            What's on your mind?
          </label>
          <span className="text-xs text-[#83243A]/60 font-mono">
            {text.length}/10,000
          </span>
        </div>

        {/* Text Area */}
        <div className="relative">
          <textarea
            id="thought-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder="Capture an insight, quick note, article excerpt, or reflection... (use #tags anywhere)"
            className="w-full resize-y rounded-2xl bg-[#FAF7F2] border border-[#E5DDD0] p-4 text-[#2D2124] placeholder:text-[#83243A]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F9D0D3]/50 focus:border-[#83243A]/50 text-sm sm:text-base leading-relaxed transition-all shadow-inner"
          />
        </div>

        {/* Dynamic Detail Pill / Toggle */}
        {(text.trim().length > 0 || showDetails) && (
          <div className="mt-4 pt-4 border-t border-[#6B1D2F]/10 space-y-3.5 animate-in fade-in duration-200">
            {/* Summary preview & edit */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-serif font-bold text-[#541423] flex items-center gap-1.5 tracking-wide">
                  <AlignLeft className="w-3.5 h-3.5 text-[#83243A]" />
                  Summary / Key Takeaway
                </span>
                {!isCustomSummary && (
                  <span className="text-[11px] text-[#83243A] font-serif italic">
                    Auto-generated from text
                  </span>
                )}
              </div>
              <input
                id="summary-input"
                type="text"
                value={summary}
                onChange={(e) => {
                  setSummary(e.target.value);
                  setIsCustomSummary(true);
                }}
                maxLength={1000}
                placeholder="A quick summary of this thought..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF4EB] border border-[#E5DDD0] text-xs sm:text-sm text-[#2D2124] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F9D0D3]/50 focus:border-[#83243A]/60 transition-colors"
              />
            </div>

            {/* Tags input */}
            <div>
              <span className="text-xs font-serif font-bold text-[#541423] flex items-center gap-1.5 mb-2 tracking-wide">
                <TagIcon className="w-3.5 h-3.5 text-[#83243A]" />
                Tags
              </span>

              <div className="flex flex-wrap items-center gap-2 mb-2">
                {tags.map((t, idx) => {
                  const tagColors = [
                    'bg-[#FDE8E9] text-[#6B1D2F] border-[#F2B3B8]',
                    'bg-[#EFEAF8] text-[#521321] border-[#CFBEED]',
                    'bg-[#FAF4EB] text-[#541423] border-[#E5DDD0]',
                  ];
                  const colorClass = tagColors[idx % tagColors.length];
                  return (
                    <span
                      key={t}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium border shadow-2xs ${colorClass}`}
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-[#83243A]/60 hover:text-[#360B15] p-0.5 rounded-full cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}

                {/* Add tag input */}
                <div className="inline-flex items-center gap-1">
                  <input
                    id="tag-input"
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="+ Add tag (Enter)"
                    className="px-2.5 py-1 rounded-lg text-xs bg-[#FAF7F2] border border-dashed border-[#83243A]/30 text-[#2D2124] placeholder:text-[#83243A]/40 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#83243A] w-28 font-mono"
                  />
                  {tagInput.trim() && (
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="p-1 rounded-lg bg-[#FDE8E9] text-[#6B1D2F] hover:bg-[#F9D0D3] text-xs border border-[#F2B3B8] cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-[#FFF5F5] text-[#83243A] text-xs border border-[#F2B3B8]">
            {error}
          </div>
        )}

        {/* Action bar */}
        <div className="mt-5 pt-3.5 flex items-center justify-between border-t border-[#6B1D2F]/10">
          <div className="flex items-center gap-2">
            {!showDetails && text.trim().length === 0 && (
              <button
                type="button"
                onClick={() => setShowDetails(true)}
                className="text-xs text-[#83243A] hover:text-[#541423] font-serif font-medium inline-flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-[#FDE8E9]/50 transition-colors cursor-pointer"
              >
                <TagIcon className="w-3 h-3" />
                <span>Add tags & summary</span>
              </button>
            )}
            <span className="hidden sm:inline text-[11px] text-[#83243A]/60 font-mono">
              Press <kbd className="px-1.5 py-0.5 rounded bg-[#FAF4EB] border border-[#E5DDD0] text-[#541423] font-mono text-[10px]">⌘</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-[#FAF4EB] border border-[#E5DDD0] text-[#541423] font-mono text-[10px]">Enter</kbd> to save
            </span>
          </div>

          <div className="flex items-center gap-2">
            {text.trim().length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setText('');
                  setSummary('');
                  setTags([]);
                  setIsCustomSummary(false);
                  setShowDetails(false);
                }}
                disabled={saving}
                className="px-3 py-1.5 rounded-xl text-xs font-sans font-medium text-[#83243A]/70 hover:text-[#360B15] hover:bg-[#FDE8E9]/40 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}

            <button
              id="save-item-btn"
              type="submit"
              disabled={saving || !text.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-serif font-bold text-sm text-[#FCFAF6] bg-[#6B1D2F] hover:bg-[#541423] shadow-scrapbook disabled:opacity-50 disabled:cursor-not-allowed active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#FDE8E9]" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <DoodleSparkle className="w-4 h-4 text-[#FDE8E9]" />
                  <span>Save to Vault</span>
                  <CornerDownLeft className="w-3.5 h-3.5 opacity-70 hidden sm:inline" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
