import React, { useState, useMemo } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Item } from '../types';
import { ItemCard } from './ItemCard';
import { DoodleSparkle, DoodleFlower } from './Doodles';

interface ItemListProps {
  items: Item[];
  loading: boolean;
  uid: string;
}

export const ItemList: React.FC<ItemListProps> = ({ items, loading, uid }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract all unique tags across items
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    items.forEach((item) => {
      item.tags?.forEach((t) => tagSet.add(t));
    });
    return Array.from(tagSet);
  }, [items]);

  // Filter items based on search and selected tag
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesTag = selectedTag ? item.tags?.includes(selectedTag) : true;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = q
        ? item.text.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.tags?.some((t) => t.toLowerCase().includes(q))
        : true;
      return matchesTag && matchesSearch;
    });
  }, [items, selectedTag, searchQuery]);

  return (
    <section id="recent-items-section" className="w-full max-w-6xl mx-auto px-4 sm:px-6 pb-20">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#561320]">
            Recently Preserved
          </h2>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#FDECEF] text-[#8E162B] border border-[#F8CDD5] shadow-2xs">
            {items.length} {items.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {/* Search Input */}
        {items.length > 0 && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#BA1B35]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-items-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories or #tags..."
              className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm rounded-2xl bg-[#FFFDF9] border border-[#BA1B35]/20 shadow-2xs text-[#2D2124] placeholder:text-[#BA1B35]/40 focus:outline-none focus:ring-2 focus:ring-[#F8CDD5]/60 focus:border-[#BA1B35]/60 transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#BA1B35]/60 hover:text-[#561320] p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tag filter bar */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          <span className="text-xs font-serif font-bold text-[#BA1B35] flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3 h-3 text-[#BA1B35]" />
            Tags:
          </span>
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all shrink-0 cursor-pointer ${
              selectedTag === null
                ? 'bg-[#BA1B35] text-[#FCFAF7] shadow-scrapbook border border-[#8E162B]'
                : 'bg-[#FFFDF9] text-[#751225] hover:bg-[#FDECEF] hover:text-[#BA1B35] border border-[#BA1B35]/20 shadow-2xs'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all shrink-0 cursor-pointer ${
                selectedTag === tag
                  ? 'bg-[#BA1B35] text-[#FCFAF7] shadow-scrapbook border border-[#8E162B]'
                  : 'bg-[#FFFDF9] text-[#751225] hover:bg-[#FDECEF] hover:text-[#BA1B35] border border-[#BA1B35]/20 shadow-2xs'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="bg-[#FFFDF9] p-6 rounded-3xl border border-[#E5DDD0] shadow-scrapbook animate-pulse space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 bg-[#FDECEF] rounded-md w-16" />
                <div className="h-3 bg-[#FAF4EB] rounded w-14" />
              </div>
              <div className="h-5 bg-[#F6EFE6] rounded-lg w-full" />
              <div className="h-4 bg-[#F6EFE6] rounded-lg w-4/5" />
              <div className="h-4 bg-[#F6EFE6] rounded-lg w-2/3" />
              <div className="pt-2 flex gap-1.5">
                <div className="h-4 bg-[#FDECEF]/60 rounded w-12" />
                <div className="h-4 bg-[#FDECEF]/60 rounded w-10" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="text-center py-16 px-4 bg-[#FFFDF9]/85 rounded-3xl border-2 border-dashed border-[#BA1B35]/25 shadow-scrapbook relative">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#FDECEF] text-[#BA1B35] flex items-center justify-center border border-[#F8CDD5] shadow-xs rotate-[-3deg]">
            <DoodleFlower className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-serif font-bold text-[#561320] mb-2">
            The page is delightfully blank
          </h3>
          <p className="text-xs sm:text-sm text-[#661223]/80 max-w-sm mx-auto leading-relaxed mb-5 font-sans">
            Preserve your first thought, book quotation, or epiphany above to begin curating your memory vault.
          </p>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#8E162B] bg-[#FDECEF] px-3.5 py-1.5 rounded-full border border-[#F8CDD5] font-mono">
            <DoodleSparkle className="w-3.5 h-3.5 text-[#BA1B35]" />
            <span>Tip: Add #hashtags in thoughts to create instant categories</span>
          </div>
        </div>
      )}

      {/* No matching filter results */}
      {!loading && items.length > 0 && filteredItems.length === 0 && (
        <div className="text-center py-14 px-4 bg-[#FFFDF9] rounded-3xl border border-[#BA1B35]/20 shadow-scrapbook">
          <p className="text-sm font-serif text-[#561320] mb-3">No thoughts match your current search.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedTag(null);
            }}
            className="text-xs font-mono text-[#8E162B] font-bold hover:underline cursor-pointer bg-[#FDECEF] px-3 py-1.5 rounded-lg border border-[#F8CDD5]"
          >
            Clear active filters
          </button>
        </div>
      )}

      {/* Items Grid */}
      {!loading && filteredItems.length > 0 && (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <ItemCard
                  item={item}
                  uid={uid}
                  onTagClick={(tag) => setSelectedTag(tag)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  );
};
