export type ChannelId = "instagram" | "linkedin" | "facebook" | "x" | "google" | "tiktok";

export type Channel = {
  id: ChannelId;
  label: string;
  cta: string;
  bias: string;
};

export const CHANNELS: Channel[] = [
  {
    id: "instagram",
    label: "Instagram",
    cta: "DM the word START, or use the link in bio.",
    bias: "Gulf and consumer businesses convert here more often than on LinkedIn. Do not treat it as a moodboard.",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    cta: "Comment with the blocker, or open the link in the first comment.",
    bias: "Useful for B2B proof. Weak as the only channel for a local service firm.",
  },
  {
    id: "facebook",
    label: "Facebook",
    cta: "Message the page. Do not ask for a like.",
    bias: "Still reaches older buyers and community groups. Vanity reach is not a lead.",
  },
  {
    id: "x",
    label: "X",
    cta: "Reply with the one question this post left open.",
    bias: "Good for a point of view. Poor as a catalogue.",
  },
  {
    id: "google",
    label: "Google Business",
    cta: "Call, or request a quote from the profile.",
    bias: "This is intent, not a brand feed. One offer, one photo, one next step.",
  },
  {
    id: "tiktok",
    label: "TikTok",
    cta: "Follow for the next step tomorrow. One idea only.",
    bias: "Volume bias lives here. One specific post beats seven generic ones.",
  },
];

export function channelById(id: ChannelId): Channel {
  const channel = CHANNELS.find((item) => item.id === id);
  if (!channel) throw new Error(`Unknown channel ${id}`);
  return channel;
}

/** What a business actually hires a marketing manager to do. Not a tool feature list. */
export const BUSINESS_WANTS: { title: string; detail: string }[] = [
  {
    title: "One post they can approve",
    detail:
      "Owners do not want a content factory. They want one post a day they can read in a minute, change one line, and approve.",
  },
  {
    title: "A next step, not a slogan",
    detail:
      "The post has to move a person: WhatsApp, a call, a form, a profile visit. A like is not the job.",
  },
  {
    title: "Proof over polish",
    detail:
      "A real number, a before and after, a client constraint. Generic AI captions are the failure mode businesses already complain about.",
  },
  {
    title: "Growth they can read",
    detail:
      "Reach, saves, follows, and clicks against the last post. If a channel cannot show a move in two weeks, it does not get a third week.",
  },
  {
    title: "Two channels, run well",
    detail:
      "UAE service firms usually win on Instagram plus WhatsApp, or Google Business plus one social feed. Five platforms at once is how budgets die.",
  },
  {
    title: "A human still ships it",
    detail:
      "The desk drafts. A person approves. Autopublish is what agencies sell. It is not what a careful business asked for.",
  },
];

/** Biases in the industry and in tool roundups. The desk refuses these. */
export const INDUSTRY_BIASES: { title: string; refuse: string }[] = [
  {
    title: "Enterprise tool bias",
    refuse:
      "Rankings in 2026 lean on Hootsuite and Sprout because of seat price and review volume. A one-person desk does not need social listening to post today.",
  },
  {
    title: "Vanity metric bias",
    refuse: "Likes and impressions flatter the report. Saves, follows, profile visits, and clicks tell you if the post worked.",
  },
  {
    title: "Always-on bias",
    refuse: "Seven channels, poorly, loses to one post a day on the channel that already gets replies.",
  },
  {
    title: "Western B2B bias",
    refuse:
      "LinkedIn-first advice ignores markets where Instagram and WhatsApp close the work. Pick the channel the buyer already opens.",
  },
  {
    title: "Autopublish bias",
    refuse: "AI that posts without approval will ship a claim the business cannot stand behind. Draft, then a person ships.",
  },
  {
    title: "Volume bias",
    refuse: "More captions is not a strategy. One specific offer, repeated until the numbers move, is.",
  },
];

export type MarketTool = {
  name: string;
  fit: string;
  price: string;
  gap: string;
};

/** Public pricing bands as of October 2026. Vendor pages move; this is a map, not a quote. */
export const MARKET_TOOLS: MarketTool[] = [
  {
    name: "Buffer",
    fit: "Small team, 1–6 channels, simple calendar.",
    price: "Free for 3 channels. Paid from about $5 per channel / month.",
    gap: "Schedules. Does not decide today’s one post or refuse a bad channel.",
  },
  {
    name: "Hootsuite",
    fit: "Agencies and mid-size teams that need inbox and approvals.",
    price: "From about $99 per user / month.",
    gap: "Broad AI (OwlyWriter / Wisdom). Priced for a department, not a daily instruction.",
  },
  {
    name: "Sprout Social",
    fit: "Brands that need listening, sentiment, and reporting.",
    price: "From about $79–$249 per seat / month. Writing AI sits on higher tiers.",
    gap: "Best analytics in the set. Wrong first buy if you have not posted consistently yet.",
  },
  {
    name: "Later",
    fit: "Instagram-first visual planning.",
    price: "From about $19 / month.",
    gap: "Grid preview. Light on the growth decision.",
  },
  {
    name: "Ocoya",
    fit: "Low-cost AI captions plus a calendar, often ecommerce.",
    price: "From about $15–$29 / month.",
    gap: "Cheap generation. Easy to ship generic copy.",
  },
  {
    name: "Predis.ai",
    fit: "Caption and creative generation.",
    price: "From about $19 / month.",
    gap: "Makes assets. Does not keep the daily instruction or the growth log.",
  },
  {
    name: "Lately",
    fit: "Turning one long video or article into many posts.",
    price: "From about $14–$49 / month.",
    gap: "Repurposing engine. Opposite of one deliberate post.",
  },
];

export type SeatDraft = {
  chatgpt: string;
  claude: string;
  copilot: string;
  grok: string;
};

export type DailyDraft = {
  seats: SeatDraft;
  finalPost: string;
  checks: string[];
};

function clip(value: string, max = 140): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export function draftDailyPost(input: {
  instruction: string;
  channel: ChannelId;
  audience: string;
  offer: string;
}): DailyDraft {
  const channel = channelById(input.channel);
  const job = clip(input.instruction);
  const who = input.audience.trim() || "the person who already has the problem";
  const offer = input.offer.trim() || "the one offer";

  const seats: SeatDraft = {
    chatgpt: `For ${who} on ${channel.label}: first line is the result, then “${job}”, then one action. Offer stays ${offer}.`,
    claude: `Only claims we can stand behind for “${job}”. No invented numbers. If ${who} would not say it back, it is not the line.`,
    copilot: `Ship list for ${channel.label}: one asset, alt text, link, approval, then schedule. The artifact is the approved post, not the chat.`,
    grok: `One post. Start at “${job}”. Cut the warmup. End on ${offer}. If it could be any business, rewrite it.`,
  };

  const finalPost = [
    job,
    `For ${who}.`,
    offer,
    channel.cta,
  ].join("\n\n");

  return {
    seats,
    finalPost,
    checks: [
      "One offer only.",
      "No number we cannot prove.",
      `Next step is specific to ${channel.label}.`,
      "A person approves before it goes live.",
    ],
  };
}

export type GrowthLog = {
  id: string;
  date: string;
  channel: ChannelId;
  reach: number;
  saves: number;
  follows: number;
  clicks: number;
  note: string;
};

export type GrowthRead = {
  label: string;
  detail: string;
  score: number | null;
  previous: number | null;
};

function intentScore(log: GrowthLog): number {
  return log.saves * 3 + log.clicks * 4 + log.follows * 5;
}

export function readGrowth(logs: GrowthLog[]): GrowthRead {
  if (logs.length === 0) {
    return {
      label: "No growth logged",
      detail: "Approve a post, then log reach, saves, follows, and clicks the next day.",
      score: null,
      previous: null,
    };
  }
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const last = sorted[sorted.length - 1];
  const score = intentScore(last);
  const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;
  const previous = prev ? intentScore(prev) : null;
  if (previous == null) {
    return {
      label: "Baseline set",
      detail: `${last.date} on ${channelById(last.channel).label} is the first mark. The next log tells you if it moved.`,
      score,
      previous,
    };
  }
  if (score > previous) {
    return {
      label: "Growing",
      detail: `Intent score ${score} vs ${previous} on the previous log. Keep this channel. Repeat the offer.`,
      score,
      previous,
    };
  }
  if (score < previous) {
    return {
      label: "Slipping",
      detail: `Intent score ${score} vs ${previous}. Do not add a channel. Change the offer or the first line.`,
      score,
      previous,
    };
  }
  return {
    label: "Flat",
    detail: `Intent score stayed at ${score}. One more specific proof, then judge again.`,
    score,
    previous,
  };
}

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
