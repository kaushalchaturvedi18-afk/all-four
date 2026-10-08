import assert from "node:assert/strict";
import test from "node:test";
import { draftDailyPost, readGrowth, type GrowthLog } from "./marketing.ts";

test("daily draft stays one post with a channel next step", () => {
  const draft = draftDailyPost({
    instruction: "Show the VAT deadline a Dubai firm misses every quarter",
    channel: "instagram",
    audience: "finance managers in Dubai",
    offer: "A 15-minute filing check",
  });
  assert.match(draft.finalPost, /VAT deadline/);
  assert.match(draft.finalPost, /DM the word START/);
  assert.equal(draft.checks.length, 4);
  assert.match(draft.seats.grok, /One post/);
  assert.match(draft.seats.copilot, /approval/);
});

test("growth read compares intent, not reach vanity", () => {
  const logs: GrowthLog[] = [
    { id: "a", date: "2026-10-01", channel: "instagram", reach: 9000, saves: 2, follows: 0, clicks: 1, note: "" },
    { id: "b", date: "2026-10-02", channel: "instagram", reach: 400, saves: 12, follows: 3, clicks: 6, note: "" },
  ];
  const read = readGrowth(logs);
  assert.equal(read.label, "Growing");
  assert.ok((read.score ?? 0) > (read.previous ?? 0));
});

test("empty growth log does not invent a trend", () => {
  const read = readGrowth([]);
  assert.equal(read.label, "No growth logged");
  assert.equal(read.score, null);
});
