/**
 * Utilities for auto-extracting summary and tags from user input
 */
export function generateAutoSummary(text: string): string {
  if (!text || !text.trim()) return '';
  const trimmed = text.trim();
  // If first line is short, use it, or first sentence
  const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length > 0 && lines[0].length > 0 && lines[0].length <= 150) {
    return lines[0];
  }
  const sentenceMatch = trimmed.match(/^([^.!?\n]+[.!?])/);
  if (sentenceMatch && sentenceMatch[1] && sentenceMatch[1].length <= 180) {
    return sentenceMatch[1].trim();
  }
  return trimmed.length > 140 ? trimmed.substring(0, 137).trim() + '...' : trimmed;
}

export function extractHashtags(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/#([\p{L}\p{N}_-]+)/gu);
  if (!matches) return [];
  const cleaned = matches.map(m => m.substring(1).toLowerCase().trim()).filter(Boolean);
  return Array.from(new Set(cleaned));
}

export function formatRelativeTime(date: Date | null): string {
  if (!date) return 'Just now';
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 45) return 'Just now';
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return `${mins}m ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}
