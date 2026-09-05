import type { Item } from '../types';

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself',
  'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most',
  'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our',
  'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than',
  'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this',
  'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when',
  'where', 'which', 'while', 'who', 'whom', 'why', 'will', 'with', 'would', 'you', 'your', 'yours',
  'yourself', 'yourselves', 'note', 'thought', 'think', 'idea', 'save', 'saved', 'want', 'today', 'really',
  'like', 'life', 'live', 'living', 'make', 'making', 'made', 'good', 'get', 'getting', 'got', 'know',
  'knowing', 'need', 'needed', 'day', 'days', 'time', 'times', 'way', 'ways', 'feel', 'feeling', 'felt',
  'things', 'thing', 'something', 'someone', 'people', 'well', 'see', 'seen', 'look', 'looking', 'going',
  'come', 'back', 'also', 'even', 'still', 'always', 'never', 'much', 'many'
]);

// Semantic topic clusters connecting related concepts, tags, and terms
export const TOPIC_CLUSTERS: Record<string, string[]> = {
  mortality: [
    'mortality', 'impermanence', 'transience', 'transient', 'impermanent',
    'death', 'dying', 'dead', 'mortal', 'finitude', 'finite', 'fleeting',
    'memento mori', 'decay', 'perish', 'passing', 'lifespan', 'existential',
    'grief', 'loss', 'temporary', 'entropy', 'afterlife', 'stoic', 'stoicism',
    'seneca', 'marcus aurelius', 'grave', 'morbid', 'cemetery', 'ashes', 'ephemeral',
    'want it to end', 'want to end', 'going to end', 'life to end', 'end soon',
    'like air', 'vapor', 'passing away', 'breath', 'vanish'
  ],
  impermanence: [
    'impermanence', 'impermanent', 'transience', 'transient', 'temporary',
    'fleeting', 'vapor', 'like air', 'passing', 'vanish', 'ephemeral', 'smoke',
    'passing away', 'breath', 'momentary', 'evanescent'
  ],
  existentialism: [
    'existential', 'existentialism', 'meaning of life', 'purpose', 'existence',
    'how long', 'why exist', 'void', 'abyss', 'despair', 'absurd', 'absurdism',
    'nihilism', 'meaning', 'being'
  ],
  focus: [
    'focus', 'attention', 'distraction', 'deep work', 'flow', 'productivity',
    'procrastination', 'concentrate', 'concentration', 'pomodoro', 'work session',
    'multitask', 'clarity', 'habits', 'discipline'
  ],
  knowledge: [
    'knowledge', 'memory', 'recall', 'learning', 'learn', 'second brain',
    'notes', 'note', 'intellectual', 'insight', 'synthesis', 'books',
    'reading', 'read', 'study', 'education', 'research', 'idea', 'thinking'
  ],
  philosophy: [
    'philosophy', 'stoic', 'stoicism', 'epictetus', 'nietzsche', 'ethics',
    'wisdom', 'meaning', 'purpose', 'virtue', 'mindset', 'buddhism',
    'zen', 'tao', 'enlightenment', 'reflection', 'meditation', 'mindfulness'
  ],
  psychology: [
    'anxiety', 'stress', 'fear', 'mental health', 'calm', 'peace', 'joy',
    'depression', 'mood', 'emotion', 'psychology', 'therapy', 'trauma',
    'resilience', 'burnout', 'wellness', 'despair', 'overwhelmed', 'healing'
  ],
  tech: [
    'code', 'coding', 'programming', 'developer', 'software', 'tech',
    'technology', 'web', 'backend', 'frontend', 'ai', 'database', 'bug',
    'typescript', 'javascript', 'python', 'api', 'engineering', 'architecture'
  ],
  business: [
    'career', 'work', 'job', 'business', 'startup', 'strategy', 'founder',
    'management', 'leadership', 'meeting', 'company', 'product', 'marketing', 'sales'
  ],
  finance: [
    'money', 'finance', 'investing', 'investment', 'budget', 'savings',
    'wealth', 'stocks', 'crypto', 'net worth', 'expenses', 'debt'
  ],
  health: [
    'health', 'fitness', 'exercise', 'workout', 'diet', 'nutrition',
    'sleep', 'running', 'gym', 'body', 'energy', 'vitality'
  ],
  relationships: [
    'relationship', 'love', 'friendship', 'family', 'partner', 'marriage',
    'connection', 'social', 'empathy', 'communication', 'people'
  ],
  creativity: [
    'art', 'writing', 'design', 'creative', 'creativity', 'music',
    'story', 'author', 'craft', 'imagination', 'poetry'
  ],
};

export const BANNED_LITERAL_WORDS = new Set([
  'life', 'might', 'want', 'think', 'good', 'bad', 'time', 'thing', 'things',
  'soon', 'long', 'air', 'going', 'kinda', 'like', 'note', 'thought', 'have',
  'from', 'with', 'about', 'just', 'feel', 'some', 'very', 'really', 'much',
  'more', 'make', 'know', 'will', 'would', 'could', 'should', 'been', 'said',
  'tell', 'even', 'then', 'also', 'what', 'when', 'where', 'which', 'here',
  'there', 'people', 'person', 'someone', 'something', 'anything', 'nothing',
  'everything', 'well', 'back', 'take', 'come', 'look', 'give', 'into', 'only',
  'over', 'such', 'than', 'them', 'these', 'those', 'supposed', 'possible', 'sometimes'
]);

/**
 * Extracts high-level conceptual/topical tags from text, rejecting literal words.
 */
export function extractConceptualTags(text: string): string[] {
  if (!text || typeof text !== 'string') return ['reflection'];
  const lower = text.toLowerCase();
  const matchedConcepts: string[] = [];

  for (const [concept, keywords] of Object.entries(TOPIC_CLUSTERS)) {
    const hits = keywords.some((kw) => lower.includes(kw));
    if (hits && !matchedConcepts.includes(concept)) {
      matchedConcepts.push(concept);
    }
  }

  if (matchedConcepts.length > 0) {
    return matchedConcepts.slice(0, 3);
  }

  return ['reflection'];
}

export interface ResurfaceResult {
  item: Item;
  score: number;
  matchedTags: string[];
  matchedKeywords: string[];
  thematicOverlap?: string[];
  explanation?: string;
}

/**
 * Normalizes a tag by stripping leading '#', whitespace, and lowercasing.
 */
export function cleanTag(tag: string): string {
  if (!tag) return '';
  return tag.replace(/^#+/, '').trim().toLowerCase();
}

/**
 * Light stemming helper to handle common suffixes for root comparison.
 * e.g. impermanence / impermanent -> impermanen
 *      transience / transient -> transien
 *      mortality / mortal -> mortal
 */
export function stemWord(word: string): string {
  if (!word || word.length <= 3) return word;
  let s = word.toLowerCase();
  
  // Suffix rules
  if (s.endsWith('ities')) return s.slice(0, -5) + 'it';
  if (s.endsWith('ity')) return s.slice(0, -3);
  if (s.endsWith('ances') || s.endsWith('ences')) return s.slice(0, -5);
  if (s.endsWith('ance') || s.endsWith('ence')) return s.slice(0, -4);
  if (s.endsWith('ant') || s.endsWith('ent')) return s.slice(0, -3);
  if (s.endsWith('ing') && s.length > 5) return s.slice(0, -3);
  if (s.endsWith('ed') && s.length > 4) return s.slice(0, -2);
  if (s.endsWith('tion') || s.endsWith('sion')) return s.slice(0, -4);
  if (s.endsWith('al') && s.length > 4) return s.slice(0, -2);
  if (s.endsWith('es') && s.length > 4) return s.slice(0, -2);
  if (s.endsWith('s') && s.length > 3 && !s.endsWith('ss')) return s.slice(0, -1);
  return s;
}

/**
 * Finds the most relevant past item based on tag overlap, stemming, and topical keyword/cluster match.
 * Returns null if no item meets the minimum relevance threshold.
 */
export function findResurfacedItem(
  currentText: string,
  items: Item[],
  currentTags: string[] = []
): ResurfaceResult | null {
  const trimmed = currentText.trim();
  if (!trimmed || trimmed.length < 3 || !items || items.length === 0) {
    return null;
  }

  // 1. Extract hashtags from current input
  const inputHashtags = (trimmed.match(/#([\p{L}\p{N}_-]+)/gu) || [])
    .map((m) => cleanTag(m))
    .filter(Boolean);

  const activeTags = Array.from(
    new Set([...inputHashtags, ...currentTags.map(cleanTag)])
  ).filter(Boolean);

  const activeTagStems = activeTags.map(stemWord);

  // 2. Extract meaningful word tokens (length >= 3, non-stopwords)
  const rawTokens = trimmed
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

  const uniqueTokens = Array.from(new Set(rawTokens));
  const tokenStems = uniqueTokens.map(stemWord);

  if (uniqueTokens.length === 0 && activeTags.length === 0) {
    return null;
  }

  // 3. Find active topic clusters present in the current input
  const activeClusters: string[] = [];
  for (const [clusterKey, words] of Object.entries(TOPIC_CLUSTERS)) {
    const hits = words.some(
      (cw) =>
        uniqueTokens.includes(cw) ||
        tokenStems.includes(stemWord(cw)) ||
        activeTags.includes(cw) ||
        activeTagStems.includes(stemWord(cw)) ||
        trimmed.toLowerCase().includes(cw)
    );
    if (hits) {
      activeClusters.push(clusterKey);
    }
  }

  let bestMatch: ResurfaceResult | null = null;
  let highestScore = 0;

  for (const item of items) {
    let score = 0;
    const cleanItemTags = (item.tags || []).map(cleanTag).filter(Boolean);
    const itemTagStems = cleanItemTags.map(stemWord);
    const itemSummaryLower = (item.summary || '').toLowerCase();
    const itemTextLower = (item.text || '').toLowerCase();

    const matchedTags: string[] = [];
    const matchedKeywords: string[] = [];

    // Check 1: Direct Tag or Stem overlap (Weight: 20 for exact tag, 15 for stem)
    for (let i = 0; i < cleanItemTags.length; i++) {
      const itag = cleanItemTags[i];
      const itagStem = itemTagStems[i];

      const exactMatch =
        activeTags.includes(itag) || uniqueTokens.includes(itag);

      const stemMatch =
        !exactMatch &&
        (activeTagStems.includes(itagStem) ||
          tokenStems.includes(itagStem) ||
          uniqueTokens.some((t) => t.startsWith(itagStem) || itag.startsWith(stemWord(t))));

      if (exactMatch) {
        score += 20;
        if (!matchedTags.includes(itag)) matchedTags.push(itag);
      } else if (stemMatch) {
        score += 15;
        if (!matchedTags.includes(itag)) matchedTags.push(itag);
      }
    }

    // Check 2: Topical Cluster match (Weight: 18)
    for (const clusterKey of activeClusters) {
      const clusterWords = TOPIC_CLUSTERS[clusterKey] || [];
      const itemHitsCluster = clusterWords.some(
        (cw) =>
          cleanItemTags.includes(cw) ||
          itemTagStems.includes(stemWord(cw)) ||
          itemSummaryLower.includes(cw) ||
          itemTextLower.includes(cw)
      );

      if (itemHitsCluster) {
        score += 18;
        if (!matchedKeywords.includes(clusterKey)) {
          matchedKeywords.push(clusterKey);
        }
      }
    }

    // Check 3: Summary / text word and stem overlap (contributes to score, never adds raw words to overlap labels)
    for (let i = 0; i < uniqueTokens.length; i++) {
      const token = uniqueTokens[i];
      const tStem = tokenStems[i];

      // Summary check
      if (itemSummaryLower.includes(token)) {
        score += 5;
      } else if (tStem.length >= 4 && itemSummaryLower.includes(tStem)) {
        score += 3;
      } else if (itemTextLower.includes(token)) {
        score += 2;
      }
    }

    // Compose high-level thematic overlap labels (tags or topic clusters, 2-3 items)
    const combinedThematic = Array.from(new Set([...matchedTags, ...matchedKeywords]))
      .filter((t) => t && t.length > 2)
      .slice(0, 3);

    // Minimum threshold: 14 points (requires a genuine tag match, stem match, or topical cluster hit)
    if (score >= 14 && score > highestScore && combinedThematic.length > 0) {
      highestScore = score;
      bestMatch = {
        item,
        score,
        matchedTags,
        matchedKeywords,
        thematicOverlap: combinedThematic,
      };
    }
  }

  return bestMatch;
}
