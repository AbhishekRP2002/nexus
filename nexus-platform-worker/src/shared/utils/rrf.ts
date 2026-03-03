/**
 * Reciprocal Rank Fusion (RRF)
 *
 * Merges multiple ranked result lists into a single ranked list.
 * score(doc) = Σ 1 / (k + rank_i) for each list where doc appears.
 * k = 60 is the standard constant from the original RRF paper.
 */

export interface RankedItem {
  id: string;
}

interface RRFResult<T extends RankedItem> {
  item: T;
  score: number;
}

export function reciprocalRankFusion<T extends RankedItem>(
  ...lists: T[][]
): RRFResult<T>[] {
  const k = 60;
  const scores = new Map<string, { score: number; item: T }>();

  for (const list of lists) {
    for (let rank = 0; rank < list.length; rank++) {
      const item = list[rank];
      const existing = scores.get(item.id);
      const rrfScore = 1 / (k + rank + 1);

      if (existing) {
        existing.score += rrfScore;
      } else {
        scores.set(item.id, { score: rrfScore, item });
      }
    }
  }

  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .map(({ item, score }) => ({ item, score }));
}
