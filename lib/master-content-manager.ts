import dialogueDuelData from "../data/raw/dialogue-duel.json" with { type: "json" };
import finishTheLineData from "../data/raw/finish-the-line.json" with { type: "json" };
import moviePyramidData from "../data/raw/movie-pyramid.json" with { type: "json" };
import whoSaidItData from "../data/raw/who-said-it.json" with { type: "json" };
import { selectDiverseChallenges, type SessionContentBlacklist } from "./content-engine.ts";
import {
  CHALLENGES as CURATED_CHALLENGES,
  type Challenge,
  type ChallengeType,
  type Difficulty,
} from "./game-data.ts";

type RawDialogueDuel = { id: string; dialogue: string; movie: string; actor: string };
type RawFinishLine = { id: string; start: string; answer: string };
type RawMoviePyramid = { id: string; movie: string; clues: string[] };
type RawWhoSaidIt = { id: string; dialogue: string; correct_actor: string };

export type MasterContentItem = {
  content_id: string;
  dialogue: string;
  movie: string;
  actor: string;
  finish: { start: string; answer: string };
  pyramid_clues: string[];
  raw_pyramid_clues: string[];
  source_ids: Record<ChallengeType, string[]>;
  quality_flags: string[];
};

export type ContentFilters = {
  types?: ChallengeType[];
  difficulties?: Difficulty[];
  actors?: string[];
  movies?: string[];
  tags?: string[];
  minQualityScore?: number;
};

type SessionSelection = {
  count: number;
  blacklist: SessionContentBlacklist;
  preferredType?: ChallengeType;
  preferredDifficulty?: Difficulty;
  filters?: ContentFilters;
  random?: () => number;
};

const normalize = (value: string) => value.replace(/\s+/g, " ").trim().toLowerCase();
const slug = (value: string) => normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function stableHash(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).toUpperCase();
}

function inferDifficulty(value: string): Difficulty {
  const words = value.trim().split(/\s+/).filter(Boolean).length;
  return words <= 3 ? "easy" : words <= 7 ? "medium" : "hard";
}

function buildMasterItems(): MasterContentItem[] {
  const duelRows = dialogueDuelData as RawDialogueDuel[];
  const finishRows = finishTheLineData as RawFinishLine[];
  const pyramidRows = moviePyramidData as RawMoviePyramid[];
  const actorRows = whoSaidItData as RawWhoSaidIt[];
  const byDialogue = new Map<string, MasterContentItem>();
  const byMovie = new Map<string, MasterContentItem>();

  for (const row of duelRows) {
    const dialogueKey = normalize(row.dialogue);
    let item = byDialogue.get(dialogueKey);
    if (!item) {
      item = {
        content_id: `BV_${slug(row.movie).replaceAll("-", "_").toUpperCase()}_${stableHash(dialogueKey)}`,
        dialogue: row.dialogue.trim(),
        movie: row.movie.trim(),
        actor: row.actor.trim(),
        finish: { start: "", answer: "" },
        pyramid_clues: [],
        raw_pyramid_clues: [],
        source_ids: { dialogue: [], finish: [], pyramid: [], actor: [] },
        quality_flags: [],
      };
      byDialogue.set(dialogueKey, item);
      byMovie.set(normalize(row.movie), item);
    }
    item.source_ids.dialogue.push(row.id);
  }

  for (const row of actorRows) {
    const item = byDialogue.get(normalize(row.dialogue));
    if (!item) continue;
    item.source_ids.actor.push(row.id);
    if (normalize(item.actor) !== normalize(row.correct_actor)) item.quality_flags.push("actor_mismatch");
  }

  for (const row of finishRows) {
    const fullLine = normalize(`${row.start} ${row.answer}`);
    const item = byDialogue.get(fullLine);
    if (!item) continue;
    item.source_ids.finish.push(row.id);
    if (!item.finish.start) item.finish = { start: row.start.trim(), answer: row.answer.trim() };
    if (!row.answer.trim() && !item.quality_flags.includes("empty_finish_answer")) {
      item.quality_flags.push("empty_finish_answer");
    }
  }

  for (const row of pyramidRows) {
    const item = byMovie.get(normalize(row.movie));
    if (!item) continue;
    item.source_ids.pyramid.push(row.id);
    if (item.raw_pyramid_clues.length) continue;
    item.raw_pyramid_clues = row.clues.map((clue) => clue.trim());
    const generic = row.clues.some((clue) => normalize(clue) === "bollywood hit");
    const unverifiedYear = row.clues.some((clue) => /^\d{4}$/.test(clue.trim()));
    const truncated = row.clues.some((clue) => {
      const normalizedClue = normalize(clue);
      return normalizedClue.length > 8
        && normalize(item.dialogue).startsWith(normalizedClue)
        && normalizedClue !== normalize(item.dialogue);
    });
    if (generic) item.quality_flags.push("generic_pyramid_clue");
    if (unverifiedYear) item.quality_flags.push("unverified_year");
    if (truncated) item.quality_flags.push("truncated_pyramid_clue");
    item.pyramid_clues = [item.actor, item.dialogue];
  }

  return [...byDialogue.values()];
}

function makeOptions(correct: string, values: string[], seed: string) {
  const pool = [...new Set(values)].filter((value) => normalize(value) !== normalize(correct));
  const offset = Number.parseInt(stableHash(seed), 36) % pool.length;
  const distractors = Array.from({ length: 3 }, (_, index) => pool[(offset + index * 7) % pool.length]);
  return [correct, ...distractors];
}

function toChallenges(items: MasterContentItem[]): Challenge[] {
  const movies = items.map((item) => item.movie);
  const actors = items.map((item) => item.actor);
  const answers = items.map((item) => item.finish.answer).filter(Boolean);
  const result: Challenge[] = [];

  for (const item of items) {
    const movieKey = `movie:${slug(item.movie)}`;
    const actorKey = `actor:${slug(item.actor)}`;
    const dialogueKey = `dialogue:${stableHash(normalize(item.dialogue))}`;
    const dedupeKeys = [movieKey, actorKey, dialogueKey];
    const tags = ["imported", movieKey, actorKey];
    const base = {
      content_id: item.content_id,
      dedupe_keys: dedupeKeys,
      quality_score: 0.95,
      tags,
      fact: `${item.actor} delivers this memorable moment in ${item.movie}.`,
    };

    result.push({
      ...base,
      question_id: `${item.content_id}::dialogue`,
      type: "dialogue",
      difficulty: inferDifficulty(item.dialogue),
      prompt: "NAME THE MOVIE",
      question: `“${item.dialogue}”`,
      options: makeOptions(item.movie, movies, `${item.content_id}:dialogue`),
      answer: item.movie,
      emoji: "🎬",
      points: 700,
    });

    result.push({
      ...base,
      question_id: `${item.content_id}::actor`,
      type: "actor",
      difficulty: inferDifficulty(item.dialogue),
      prompt: "WHO SAID IT?",
      question: `“${item.dialogue}”`,
      options: makeOptions(item.actor, actors, `${item.content_id}:actor`),
      answer: item.actor,
      emoji: "⭐",
      points: 650,
    });

    if (item.finish.answer) {
      result.push({
        ...base,
        question_id: `${item.content_id}::finish`,
        type: "finish",
        difficulty: inferDifficulty(item.finish.answer),
        prompt: "FINISH THE ICONIC LINE",
        question: `“${item.finish.start}…”`,
        options: makeOptions(item.finish.answer, answers, `${item.content_id}:finish`),
        answer: item.finish.answer,
        emoji: "✨",
        points: 650,
      });
    }

    result.push({
      ...base,
      question_id: `${item.content_id}::pyramid`,
      type: "pyramid",
      difficulty: "hard",
      quality_score: 0.65,
      prompt: "GUESS THE MOVIE",
      question: "Which Bollywood film connects these clues?",
      clues: item.pyramid_clues,
      options: makeOptions(item.movie, movies, `${item.content_id}:pyramid`),
      answer: item.movie,
      emoji: "🔺",
      points: 1000,
    });
  }
  return result;
}

export class MasterContentManager {
  private readonly catalog: Challenge[];

  constructor(catalog: Challenge[]) {
    this.catalog = catalog;
  }

  all() {
    return [...this.catalog];
  }

  filter(filters: ContentFilters = {}) {
    const actorTags = filters.actors?.map((actor) => `actor:${slug(actor)}`);
    const movieTags = filters.movies?.map((movie) => `movie:${slug(movie)}`);
    return this.catalog.filter((item) => {
      if (filters.types?.length && !filters.types.includes(item.type)) return false;
      if (filters.difficulties?.length && !filters.difficulties.includes(item.difficulty)) return false;
      if (filters.minQualityScore !== undefined && item.quality_score < filters.minQualityScore) return false;
      if (actorTags?.length && !actorTags.some((tag) => item.tags.includes(tag))) return false;
      if (movieTags?.length && !movieTags.some((tag) => item.tags.includes(tag))) return false;
      if (filters.tags?.length && !filters.tags.every((tag) => item.tags.includes(tag))) return false;
      return true;
    });
  }

  selectSession({ count, blacklist, preferredType, preferredDifficulty, filters, random }: SessionSelection) {
    return selectDiverseChallenges({
      items: this.filter(filters),
      count,
      blacklist,
      preferredType,
      preferredDifficulty,
      random,
    });
  }
}

export const MASTER_CONTENT_ITEMS = buildMasterItems();
export const IMPORTED_CHALLENGES = toChallenges(MASTER_CONTENT_ITEMS);
export const MASTER_CONTENT_MANAGER = new MasterContentManager([
  ...CURATED_CHALLENGES,
  ...IMPORTED_CHALLENGES,
]);

export const CONTENT_AUDIT = {
  source_files: 4,
  source_records: 400,
  canonical_items: MASTER_CONTENT_ITEMS.length,
  generated_mode_variants: IMPORTED_CHALLENGES.length,
  duplicate_source_rows_collapsed: 400 - MASTER_CONTENT_ITEMS.length * 4,
  flagged_items: MASTER_CONTENT_ITEMS.filter((item) => item.quality_flags.length > 0).length,
};

export function difficultyForXp(xp: number): Difficulty {
  if (xp < 1000) return "easy";
  if (xp < 3000) return "medium";
  return "hard";
}
