import { createServerFn } from "@tanstack/react-start";
import { isSeatId, localRun, type DeskRun, type SeatTake } from "./local-run";
import type { SeatId } from "./roster";

type RunResult =
  | { ok: true; source: "grok" | "desk"; run: DeskRun }
  | { ok: false; error: string };

const SYSTEM = `You are the lead of a four-seat desk. The seats are exactly ChatGPT, Claude, Copilot, and Grok.
You write every seat yourself. Do not claim you called OpenAI, Anthropic, or GitHub.
Each take must use the user's brief, be concrete, and be two sentences max.
Each move is one action for today, under 16 words.
Return only JSON with this shape:
{"seats":[{"id":"chatgpt","take":"","move":""},{"id":"claude","take":"","move":""},{"id":"copilot","take":"","move":""},{"id":"grok","take":"","move":""}],"covers":[{"gap":"","owner":"chatgpt","closer":"grok"}],"clashes":[{"left":"","right":"","call":""}],"ship":["","","","",""]}
covers: exactly 4, one weakness per seat, closer is a different seat.
clashes: exactly 2 disagreements, each with a call that decides it.
ship: exactly 5 ordered moves for today. No markdown.`;

function parseRun(text: string): DeskRun | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object") return null;
  const body = raw as {
    seats?: unknown;
    covers?: unknown;
    clashes?: unknown;
    ship?: unknown;
  };
  if (!Array.isArray(body.seats) || !Array.isArray(body.covers) || !Array.isArray(body.clashes) || !Array.isArray(body.ship)) {
    return null;
  }

  const seats = {} as Record<SeatId, SeatTake>;
  for (const item of body.seats) {
    if (!item || typeof item !== "object") return null;
    const row = item as { id?: unknown; take?: unknown; move?: unknown };
    if (typeof row.id !== "string" || !isSeatId(row.id)) return null;
    if (typeof row.take !== "string" || typeof row.move !== "string") return null;
    const take = row.take.trim();
    const move = row.move.trim();
    if (!take || !move) return null;
    seats[row.id] = { take, move };
  }
  if (!seats.chatgpt || !seats.claude || !seats.copilot || !seats.grok) return null;

  const covers: DeskRun["covers"] = [];
  for (const item of body.covers.slice(0, 4)) {
    if (!item || typeof item !== "object") return null;
    const row = item as { gap?: unknown; owner?: unknown; closer?: unknown };
    if (typeof row.gap !== "string" || typeof row.owner !== "string" || typeof row.closer !== "string") return null;
    if (!isSeatId(row.owner) || !isSeatId(row.closer) || row.owner === row.closer) return null;
    covers.push({ gap: row.gap.trim(), owner: row.owner, closer: row.closer });
  }
  if (covers.length < 4) return null;

  const clashes: DeskRun["clashes"] = [];
  for (const item of body.clashes.slice(0, 2)) {
    if (!item || typeof item !== "object") return null;
    const row = item as { left?: unknown; right?: unknown; call?: unknown };
    if (typeof row.left !== "string" || typeof row.right !== "string" || typeof row.call !== "string") return null;
    clashes.push({ left: row.left.trim(), right: row.right.trim(), call: row.call.trim() });
  }
  if (clashes.length < 2) return null;

  const ship = body.ship
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
  if (ship.length < 4) return null;

  return { seats, covers, clashes, ship };
}

async function askGrok(brief: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(28000),
    body: JSON.stringify({
      model: "grok-4.5",
      temperature: 0.4,
      max_tokens: 1100,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: brief },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`xAI ${res.status}`);
  }
  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return body.choices?.[0]?.message?.content ?? "";
}

export const runDesk = createServerFn({ method: "POST" })
  .validator((input: { brief?: unknown }) => {
    if (!input || typeof input.brief !== "string") {
      throw new Error("Give the desk a brief.");
    }
    const brief = input.brief.trim().slice(0, 700);
    if (brief.length < 8) throw new Error("Say a little more.");
    return { brief };
  })
  .handler(async ({ data }): Promise<RunResult> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return { ok: true, source: "desk", run: localRun(data.brief) };
    }
    try {
      const text = await askGrok(data.brief, apiKey);
      const run = parseRun(text);
      if (!run) return { ok: true, source: "desk", run: localRun(data.brief) };
      return { ok: true, source: "grok", run };
    } catch {
      return { ok: true, source: "desk", run: localRun(data.brief) };
    }
  });
