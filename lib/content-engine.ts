import type { Challenge, ChallengeType, Difficulty } from "./game-data";

export const CONTENT_BLACKLIST_WINDOW = 50;

export type BlacklistEntry = {
  contentId: string;
  dedupeKeys: string[];
};

/**
 * Browser-tab-level question history. The newest 50 served questions remain
 * unavailable, including alternate game-mode treatments of the same entity.
 */
export class SessionContentBlacklist {
  private history: BlacklistEntry[] = [];

  constructor(entries: BlacklistEntry[] = []) {
    this.history = entries.slice(-CONTENT_BLACKLIST_WINDOW);
  }

  blocks(challenge: Challenge) {
    const activeKeys = new Set(this.history.flatMap((entry) => entry.dedupeKeys));
    return this.history.some((entry) => entry.contentId === challenge.content_id)
      || challenge.dedupe_keys.some((key) => activeKeys.has(key));
  }

  add(challenge: Challenge) {
    if (this.history.some((entry) => entry.contentId === challenge.content_id)) return;
    this.history.push({ contentId: challenge.content_id, dedupeKeys: challenge.dedupe_keys });
    this.history = this.history.slice(-CONTENT_BLACKLIST_WINDOW);
  }

  addMany(challenges: Challenge[]) {
    challenges.forEach((challenge) => this.add(challenge));
  }

  snapshot() {
    return this.history.map((entry) => ({ ...entry, dedupeKeys: [...entry.dedupeKeys] }));
  }

  get size() {
    return this.history.length;
  }
}

type SelectionOptions = {
  items: Challenge[];
  count: number;
  blacklist: SessionContentBlacklist;
  preferredType?: ChallengeType;
  preferredDifficulty?: Difficulty;
  random?: () => number;
};

/**
 * Selects for content diversity first, then uses randomness only to break ties.
 * It never returns duplicate canonical IDs or conflicting entity/clue keys.
 */
export function selectDiverseChallenges({
  items,
  count,
  blacklist,
  preferredType,
  preferredDifficulty,
  random = Math.random,
}: SelectionOptions): Challenge[] {
  const available = items.filter((item) => !blacklist.blocks(item));
  const selected: Challenge[] = [];
  const selectedKeys = new Set<string>();
  const typeCounts = new Map<ChallengeType, number>();

  while (selected.length < count) {
    const candidates = available.filter((item) =>
      !selected.some((chosen) => chosen.content_id === item.content_id)
      && !item.dedupe_keys.some((key) => selectedKeys.has(key)),
    );
    if (!candidates.length) break;

    const ranked = candidates
      .map((item) => {
        const typeCount = typeCounts.get(item.type) ?? 0;
        const preferredBoost = preferredType && item.type === preferredType ? 100 : 0;
        const difficultyBoost = preferredDifficulty && item.difficulty === preferredDifficulty ? 12 : 0;
        return { item, score: preferredBoost + difficultyBoost - typeCount * 4 + random() };
      })
      .sort((a, b) => b.score - a.score);

    const chosen = ranked[0].item;
    selected.push(chosen);
    chosen.dedupe_keys.forEach((key) => selectedKeys.add(key));
    typeCounts.set(chosen.type, (typeCounts.get(chosen.type) ?? 0) + 1);
  }

  return selected;
}

export function validateContentCatalog(items: Challenge[]) {
  const seenQuestions = new Set<string>();
  for (const item of items) {
    if (!item.content_id.trim()) throw new Error("Every content item requires a content_id.");
    if (!item.question_id.trim()) throw new Error(`Missing question_id: ${item.content_id}`);
    if (seenQuestions.has(item.question_id)) throw new Error(`Duplicate question_id: ${item.question_id}`);
    if (!item.dedupe_keys.length) throw new Error(`Missing dedupe_keys: ${item.content_id}`);
    seenQuestions.add(item.question_id);
  }
  return true;
}
