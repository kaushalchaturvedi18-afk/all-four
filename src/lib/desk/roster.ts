export type SeatId = "chatgpt" | "claude" | "copilot" | "grok";

export type Seat = {
  id: SeatId;
  name: string;
  mark: string;
  role: string;
  owns: string;
};

export const SEATS: Seat[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    mark: "01",
    role: "Clarity",
    owns: "Turns a messy ask into steps a busy person can run.",
  },
  {
    id: "claude",
    name: "Claude",
    mark: "02",
    role: "Care",
    owns: "Holds the nuance, the risk, and the version worth keeping.",
  },
  {
    id: "copilot",
    name: "Copilot",
    mark: "03",
    role: "Build",
    owns: "Puts the decision in the repo as a diff, not a speech.",
  },
  {
    id: "grok",
    name: "Grok",
    mark: "04",
    role: "Edge",
    owns: "Cuts what is polite, slow, or the wrong job for today.",
  },
];

export const SEAT_IDS: SeatId[] = ["chatgpt", "claude", "copilot", "grok"];

export function seatById(id: SeatId): Seat {
  const seat = SEATS.find((item) => item.id === id);
  if (!seat) throw new Error(`Unknown seat ${id}`);
  return seat;
}

export type Gap = {
  id: string;
  gap: string;
  exposed: SeatId;
  closer: SeatId;
  closerDoes: string;
};

export const GAPS: Gap[] = [
  {
    id: "generic",
    gap: "Sounds finished and says nothing specific",
    exposed: "chatgpt",
    closer: "grok",
    closerDoes: "Strikes the lines that could describe any project.",
  },
  {
    id: "fake-detail",
    gap: "A confident detail that was never checked",
    exposed: "chatgpt",
    closer: "claude",
    closerDoes: "Marks what is unknown before it becomes a fact.",
  },
  {
    id: "no-diff",
    gap: "A clean plan with no path into the code",
    exposed: "chatgpt",
    closer: "copilot",
    closerDoes: "Turns the plan into files, a test, and a diff.",
  },
  {
    id: "essay",
    gap: "Careful writing that never becomes a ship",
    exposed: "claude",
    closer: "copilot",
    closerDoes: "Stops the essay and opens the change.",
  },
  {
    id: "hedge",
    gap: "Hedged until the decision disappears",
    exposed: "claude",
    closer: "grok",
    closerDoes: "Picks a side and writes the sentence you can send.",
  },
  {
    id: "dense",
    gap: "Too dense for the rest of the team",
    exposed: "claude",
    closer: "chatgpt",
    closerDoes: "Rewrites it so a new person can run it.",
  },
  {
    id: "cargo",
    gap: "Copies the repo’s bad pattern because it is nearby",
    exposed: "copilot",
    closer: "claude",
    closerDoes: "Asks whether this change should exist at all.",
  },
  {
    id: "narrow",
    gap: "Blind to anything outside the open files",
    exposed: "copilot",
    closer: "chatgpt",
    closerDoes: "Zooms out to the user, the constraint, the ask.",
  },
  {
    id: "wrong-build",
    gap: "Ships the wrong thing, cleanly",
    exposed: "copilot",
    closer: "grok",
    closerDoes: "Kills the feature that should not be built today.",
  },
  {
    id: "bruise",
    gap: "A sharp take that bruises the room",
    exposed: "grok",
    closer: "claude",
    closerDoes: "Keeps the point and removes the bruise.",
  },
  {
    id: "no-land",
    gap: "A take with nowhere to land in the product",
    exposed: "grok",
    closer: "copilot",
    closerDoes: "Lands it in the codebase before it goes cold.",
  },
  {
    id: "no-lesson",
    gap: "Too fast to leave a lesson behind",
    exposed: "grok",
    closer: "chatgpt",
    closerDoes: "Leaves a version the team can reuse tomorrow.",
  },
];

export type Mission = {
  id: string;
  title: string;
  brief: string;
};

export const MISSIONS: Mission[] = [
  {
    id: "page",
    title: "Landing that converts nobody",
    brief:
      "Rewrite today's landing page so a stranger understands the product in twelve seconds and knows the one action to take.",
  },
  {
    id: "asked",
    title: "The feature they asked for twice",
    brief:
      "Ship the feature users already asked for twice. Cut scope to what can merge today and name what waits.",
  },
  {
    id: "pitch",
    title: "Pitch a stranger can repeat",
    brief:
      "Rewrite the pitch so someone who has never heard of us can repeat it after one read, without our jargon.",
  },
  {
    id: "bug",
    title: "The bug that only hits production",
    brief:
      "Find and fix the bug that only shows up in production. One cause, one patch, one check. Do not boil the ocean.",
  },
  {
    id: "meet",
    title: "The meeting that should be a doc",
    brief:
      "Kill today's status meeting. Replace it with a one-page doc the team can read in four minutes and reply to in place.",
  },
];
