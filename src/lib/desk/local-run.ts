import { SEAT_IDS, type SeatId } from "./roster";

export type SeatTake = {
  take: string;
  move: string;
};

export type DeskRun = {
  seats: Record<SeatId, SeatTake>;
  covers: { gap: string; owner: SeatId; closer: SeatId }[];
  clashes: { left: string; right: string; call: string }[];
  ship: string[];
};

type Lens = "build" | "write" | "decide" | "debug" | "general";

function lensOf(brief: string): Lens {
  const text = brief.toLowerCase();
  if (/\b(bug|error|crash|fail|broken|fix|prod)\b/.test(text)) return "debug";
  if (/\b(code|api|component|implement|diff|merge|repo|feature|ship)\b/.test(text)) return "build";
  if (/\b(write|copy|headline|pitch|email|doc|landing|page|rewrite)\b/.test(text)) return "write";
  if (/\b(decide|choose|should|versus|vs\.?|or)\b/.test(text)) return "decide";
  return "general";
}

function clip(brief: string, max = 110): string {
  const text = brief.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

const TAKES: Record<Lens, Record<SeatId, (job: string) => SeatTake>> = {
  build: {
    chatgpt: (job) => ({
      take: `State “${job}” as one outcome, three steps, and one non-goal. If a teammate cannot repeat it, it is not ready to code.`,
      move: "Write the one-paragraph spec before anyone opens the editor.",
    }),
    claude: (job) => ({
      take: `Name what “${job}” must not break, and which assumption is still unproven. Keep that note to half a page.`,
      move: "List two risks and the assumption the diff depends on.",
    }),
    copilot: (job) => ({
      take: `Implement “${job}” as the smallest change in the files that already own this behavior. One failing test first.`,
      move: "Open the diff. No new framework, no second feature.",
    }),
    grok: (job) => ({
      take: `If “${job}” is the wrong job for today, say so in one sentence and name the job that replaces it.`,
      move: "Delete any step that does not merge today.",
    }),
  },
  write: {
    chatgpt: (job) => ({
      take: `Lead “${job}” with the outcome in the first line. Then the proof. Then the single action. Cut the warmup.`,
      move: "Draft the version a stranger can read once and repeat.",
    }),
    claude: (job) => ({
      take: `Keep the sentence that is true and specific to “${job}”. Remove the one that only sounds like a brand.`,
      move: "Mark every claim that is not yet earned.",
    }),
    copilot: (job) => ({
      take: `Put “${job}” where it will actually ship: the page, the doc, the template. Words that never leave a chat do not count.`,
      move: "Paste the final lines into the real surface.",
    }),
    grok: (job) => ({
      take: `Say “${job}” the way you would say it out loud to someone impatient. If you would not, it is still corporate.`,
      move: "Cut the first paragraph. Start at the point.",
    }),
  },
  decide: {
    chatgpt: (job) => ({
      take: `Frame “${job}” as the choice, the constraint, and the cost of waiting. One page, not a survey of every option.`,
      move: "Write the decision in a sentence the team can quote.",
    }),
    claude: (job) => ({
      take: `For “${job}”, name who gets hurt if we are wrong, and what we would need to see to reverse it.`,
      move: "Add the reverse condition under the decision.",
    }),
    copilot: (job) => ({
      take: `A decision on “${job}” is real when a branch, a flag, or a deleted path exists. Otherwise it is still a meeting.`,
      move: "Make the choice visible in the product today.",
    }),
    grok: (job) => ({
      take: `Pick a side on “${job}”. “It depends” is allowed only if you name the one fact it depends on.`,
      move: "Kill the option that is only there to be polite.",
    }),
  },
  debug: {
    chatgpt: (job) => ({
      take: `Write “${job}” as: what the user sees, what should happen, and the last change that touched it.`,
      move: "One paragraph of symptoms. No theories yet.",
    }),
    claude: (job) => ({
      take: `Separate what we observed about “${job}” from what we are guessing. Do not patch a guess.`,
      move: "List observed vs guessed in two short columns.",
    }),
    copilot: (job) => ({
      take: `Reproduce “${job}”, then change one thing. The patch is the smallest diff that makes the check pass.`,
      move: "Failing check, then the patch, then the same check green.",
    }),
    grok: (job) => ({
      take: `If “${job}” has three suspected causes, you do not have a cause. Pick the one you can prove before lunch.`,
      move: "Drop every theory you cannot test today.",
    }),
  },
  general: {
    chatgpt: (job) => ({
      take: `Turn “${job}” into an outcome, the first move, and what “done today” means. Leave the rest out.`,
      move: "Write done-today in one line.",
    }),
    claude: (job) => ({
      take: `On “${job}”, say what would make this the wrong move, in two sentences. Then proceed if it still stands.`,
      move: "Write the failure condition before the plan.",
    }),
    copilot: (job) => ({
      take: `“${job}” needs an artifact: a diff, a page, a doc, or a sent message. A chat reply is not the artifact.`,
      move: "Name the artifact and start it.",
    }),
    grok: (job) => ({
      take: `Do “${job}” smaller. The version that ships today beats the version that impresses nobody tomorrow.`,
      move: "Cut the scope in half, then start.",
    }),
  },
};

export function localRun(brief: string): DeskRun {
  const job = clip(brief);
  const lens = lensOf(brief);
  const bank = TAKES[lens];
  const seats = {
    chatgpt: bank.chatgpt(job),
    claude: bank.claude(job),
    copilot: bank.copilot(job),
    grok: bank.grok(job),
  };

  return {
    seats,
    covers: [
      {
        gap: "A plan so general it fits any brief",
        owner: "chatgpt",
        closer: "grok",
      },
      {
        gap: "A careful note that never becomes the work",
        owner: "claude",
        closer: "copilot",
      },
      {
        gap: "A clean build of the wrong thing",
        owner: "copilot",
        closer: "grok",
      },
      {
        gap: "A sharp call nobody else can run",
        owner: "grok",
        closer: "chatgpt",
      },
    ],
    clashes: [
      {
        left: "Claude wants another pass before anything moves.",
        right: "Copilot wants the artifact now.",
        call: "One risk note, then the artifact. No third pass today.",
      },
      {
        left: "ChatGPT wants the full outline.",
        right: "Grok wants one sentence.",
        call: "One sentence on top. Outline only if someone else must execute it.",
      },
    ],
    ship: [
      seats.chatgpt.move,
      seats.claude.move,
      seats.grok.move,
      seats.copilot.move,
      "Stop. What is not in those four lines waits until tomorrow.",
    ],
  };
}

export function isSeatId(value: string): value is SeatId {
  return (SEAT_IDS as string[]).includes(value);
}
