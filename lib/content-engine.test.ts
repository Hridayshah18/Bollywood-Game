import assert from "node:assert/strict";
import test from "node:test";
import { CHALLENGES, type Challenge } from "./game-data.ts";
import {
  CONTENT_BLACKLIST_WINDOW,
  SessionContentBlacklist,
  selectDiverseChallenges,
  validateContentCatalog,
} from "./content-engine.ts";
import {
  CONTENT_AUDIT,
  IMPORTED_CHALLENGES,
  MASTER_CONTENT_ITEMS,
  MASTER_CONTENT_MANAGER,
} from "./master-content-manager.ts";

test("catalog has a unique canonical content_id for every item", () => {
  assert.equal(validateContentCatalog(CHALLENGES), true);
  assert.ok(CHALLENGES.length > CONTENT_BLACKLIST_WINDOW);
});

test("four uploaded files collapse to 25 canonical content units", () => {
  assert.deepEqual(CONTENT_AUDIT, {
    source_files: 4,
    source_records: 400,
    canonical_items: 25,
    generated_mode_variants: 99,
    duplicate_source_rows_collapsed: 300,
    flagged_items: 25,
  });
  assert.equal(MASTER_CONTENT_ITEMS.every((item) =>
    Object.values(item.source_ids).every((ids) => ids.length === 4)), true);
});

test("one imported prompt shares a blacklist identity across every game mode", () => {
  const variants = IMPORTED_CHALLENGES.filter((item) => item.content_id === IMPORTED_CHALLENGES[0].content_id);
  assert.equal(variants.length, 4);
  assert.equal(new Set(variants.map((item) => item.question_id)).size, 4);
  const blacklist = new SessionContentBlacklist();
  blacklist.add(variants[0]);
  assert.equal(variants.slice(1).every((variant) => blacklist.blocks(variant)), true);
});

test("master manager filters by mode, difficulty, actor, movie, tags, and quality", () => {
  const filtered = MASTER_CONTENT_MANAGER.filter({
    types: ["actor"],
    difficulties: ["easy", "medium", "hard"],
    actors: ["Aamir Khan"],
    movies: ["3 Idiots"],
    tags: ["imported"],
    minQualityScore: 0.9,
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].answer, "Aamir Khan");
});

test("master manager sustains long sessions without repeating canonical content", () => {
  const blacklist = new SessionContentBlacklist();
  const recent: string[] = [];
  for (let session = 0; session < 30; session += 1) {
    const selected = MASTER_CONTENT_MANAGER.selectSession({
      count: 5,
      blacklist,
      preferredDifficulty: session < 10 ? "easy" : session < 20 ? "medium" : "hard",
      filters: { minQualityScore: 0.6 },
      random: () => 0.5,
    });
    assert.equal(selected.length, 5);
    for (const item of selected) {
      assert.equal(recent.includes(item.content_id), false);
      blacklist.add(item);
      recent.push(item.content_id);
      if (recent.length > CONTENT_BLACKLIST_WINDOW) recent.shift();
    }
  }
});

test("alternate treatments of one movie are blocked across modes", () => {
  const blacklist = new SessionContentBlacklist();
  const dialogue = CHALLENGES.find((item) => item.content_id === "DANGAL_001")!;
  const pyramid = CHALLENGES.find((item) => item.content_id === "DANGAL_002")!;
  blacklist.add(dialogue);
  assert.equal(blacklist.blocks(pyramid), true);
});

test("the same featured actor cannot return under a different clue", () => {
  const blacklist = new SessionContentBlacklist();
  const original = CHALLENGES.find((item) => item.content_id === "YJHD_001")!;
  const alternate: Challenge = {
    ...original,
    content_id: "ACTOR_VARIANT_TEST",
    dedupe_keys: ["movie:test-film", "actor:deepika-padukone", "actor-clue:variant"],
  };
  blacklist.add(original);
  assert.equal(blacklist.blocks(alternate), true);
});

test("selector never repeats an id or clue entity inside a round", () => {
  const selected = selectDiverseChallenges({
    items: CHALLENGES,
    count: 5,
    blacklist: new SessionContentBlacklist(),
    random: () => 0.5,
  });
  assert.equal(selected.length, 5);
  assert.equal(new Set(selected.map((item) => item.content_id)).size, selected.length);
  const keys = selected.flatMap((item) => item.dedupe_keys);
  assert.equal(new Set(keys).size, keys.length);
});

test("a content id cannot recur until more than 50 questions have passed", () => {
  const blacklist = new SessionContentBlacklist();
  const lastSeen = new Map<string, number>();
  let position = 0;

  for (let round = 0; round < 20; round += 1) {
    const selected = selectDiverseChallenges({
      items: CHALLENGES,
      count: 5,
      blacklist,
      random: () => 0.5,
    });
    assert.equal(selected.length, 5);

    for (const item of selected) {
      const previous = lastSeen.get(item.content_id);
      if (previous !== undefined) assert.ok(position - previous > CONTENT_BLACKLIST_WINDOW);
      assert.equal(blacklist.blocks(item), false);
      blacklist.add(item);
      lastSeen.set(item.content_id, position);
      position += 1;
    }
  }
});

test("blacklist rolls over at exactly 50 served questions", () => {
  const makeItem = (index: number): Challenge => ({
    question_id: `TEST_${index}::dialogue`,
    content_id: `TEST_${index}`,
    dedupe_keys: [`movie:test-${index}`],
    type: "dialogue",
    difficulty: "easy",
    quality_score: 1,
    tags: ["test"],
    prompt: "Test",
    question: "Test",
    options: ["A", "B"],
    answer: "A",
    fact: "Test",
    emoji: "🎬",
    points: 1,
  });
  const blacklist = new SessionContentBlacklist();
  const items = Array.from({ length: CONTENT_BLACKLIST_WINDOW + 1 }, (_, index) => makeItem(index));
  items.forEach((item) => blacklist.add(item));

  assert.equal(blacklist.size, CONTENT_BLACKLIST_WINDOW);
  assert.equal(blacklist.blocks(items[0]), false);
  assert.equal(blacklist.blocks(items[1]), true);
});
