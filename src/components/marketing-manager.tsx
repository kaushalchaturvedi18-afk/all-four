import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import {
  BUSINESS_WANTS,
  CHANNELS,
  INDUSTRY_BIASES,
  MARKET_TOOLS,
  channelById,
  draftDailyPost,
  readGrowth,
  todayKey,
  type ChannelId,
  type GrowthLog,
} from "@/lib/desk/marketing";

type ApprovedPost = {
  id: string;
  date: string;
  channel: ChannelId;
  audience: string;
  offer: string;
  instruction: string;
  finalPost: string;
};

type Store = {
  posts: ApprovedPost[];
  logs: GrowthLog[];
};

const STORAGE_KEY = "all-four.marketing.v1";
const EMPTY: Store = { posts: [], logs: [] };

function loadStore(): Store {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Store;
    return {
      posts: Array.isArray(parsed.posts) ? parsed.posts : [],
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
    };
  } catch {
    return EMPTY;
  }
}

export function MarketingManager() {
  const [store, setStore] = useState<Store>(EMPTY);
  const [ready, setReady] = useState(false);
  const [channel, setChannel] = useState<ChannelId>("instagram");
  const [audience, setAudience] = useState("");
  const [offer, setOffer] = useState("");
  const [instruction, setInstruction] = useState("");
  const [draft, setDraft] = useState<ReturnType<typeof draftDailyPost> | null>(null);
  const [finalPost, setFinalPost] = useState("");
  const [reach, setReach] = useState("");
  const [saves, setSaves] = useState("");
  const [follows, setFollows] = useState("");
  const [clicks, setClicks] = useState("");
  const [note, setNote] = useState("");
  const [panel, setPanel] = useState<"wants" | "bias" | "tools">("wants");

  useEffect(() => {
    setStore(loadStore());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store, ready]);

  const growth = useMemo(() => readGrowth(store.logs), [store.logs]);
  const today = todayKey();
  const postedToday = store.posts.some((post) => post.date === today);

  function runDraft() {
    const text = instruction.trim();
    if (text.length < 8) return;
    const next = draftDailyPost({ instruction: text, channel, audience, offer });
    setDraft(next);
    setFinalPost(next.finalPost);
  }

  function approve() {
    const text = finalPost.trim();
    if (text.length < 8) return;
    const post: ApprovedPost = {
      id: crypto.randomUUID(),
      date: today,
      channel,
      audience: audience.trim(),
      offer: offer.trim(),
      instruction: instruction.trim(),
      finalPost: text,
    };
    setStore((current) => ({ ...current, posts: [post, ...current.posts].slice(0, 30) }));
  }

  function logGrowth() {
    const entry: GrowthLog = {
      id: crypto.randomUUID(),
      date: today,
      channel,
      reach: Number(reach) || 0,
      saves: Number(saves) || 0,
      follows: Number(follows) || 0,
      clicks: Number(clicks) || 0,
      note: note.trim(),
    };
    setStore((current) => ({ ...current, logs: [...current.logs, entry].slice(-30) }));
    setReach("");
    setSaves("");
    setFollows("");
    setClicks("");
    setNote("");
  }

  const recent = [...store.logs].slice(-7);

  return (
    <div className="flex flex-col gap-6">
      <section className="border border-line bg-surface p-4">
        <p className="text-xs font-medium tracking-widest text-muted uppercase">Daily instruction</p>
        <h2 className="mt-1 font-display text-3xl">One post. Then check if it grew.</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Write what today’s post must do. ChatGPT, Claude, Copilot, and Grok draft it as roles on this desk. You approve. Tomorrow you log growth. This does not publish to the networks.
        </p>
        {postedToday ? (
          <p className="mt-3 text-sm font-medium text-accent">Today already has an approved post. A second one waits.</p>
        ) : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs tracking-widest text-muted uppercase">Channel</span>
            <select
              value={channel}
              onChange={(event) => setChannel(event.target.value as ChannelId)}
              className="min-h-11 border border-line bg-bg px-3 text-fg"
            >
              {CHANNELS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs tracking-widest text-muted uppercase">Who it is for</span>
            <input
              value={audience}
              onChange={(event) => setAudience(event.target.value)}
              maxLength={80}
              placeholder="Finance managers in Dubai"
              className="min-h-11 border border-line bg-bg px-3 text-fg outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="text-xs tracking-widest text-muted uppercase">The one offer</span>
            <input
              value={offer}
              onChange={(event) => setOffer(event.target.value)}
              maxLength={100}
              placeholder="A 15-minute filing check"
              className="min-h-11 border border-line bg-bg px-3 text-fg outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="text-xs tracking-widest text-muted uppercase">Instruction for today</span>
            <textarea
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              rows={4}
              maxLength={400}
              placeholder="What must this one post say or prove today?"
              className="w-full resize-none border border-line bg-bg px-3 py-3 text-sm leading-relaxed text-fg outline-none"
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-muted">{channelById(channel).bias}</p>
        <button
          type="button"
          onClick={runDraft}
          disabled={instruction.trim().length < 8}
          className="mt-3 min-h-11 bg-accent px-4 text-sm font-semibold text-ink disabled:opacity-50"
        >
          Draft today’s post
        </button>
      </section>

      {draft ? (
        <section className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["ChatGPT", "Clarity", draft.seats.chatgpt],
              ["Claude", "Care", draft.seats.claude],
              ["Copilot", "Build", draft.seats.copilot],
              ["Grok", "Edge", draft.seats.grok],
            ] as const
          ).map(([name, role, line]) => (
            <article key={name} className="rise border border-line bg-surface p-4">
              <header className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-2xl">{name}</h3>
                <p className="text-xs tracking-widest text-muted uppercase">{role}</p>
              </header>
              <p className="mt-2 text-sm leading-relaxed">{line}</p>
            </article>
          ))}
          <article className="border border-accent bg-surface p-4 sm:col-span-2">
            <h3 className="text-xs font-medium tracking-widest text-accent uppercase">Post to approve</h3>
            <textarea
              value={finalPost}
              onChange={(event) => setFinalPost(event.target.value)}
              rows={6}
              maxLength={600}
              className="mt-3 w-full resize-none border border-line bg-bg px-3 py-3 text-sm leading-relaxed text-fg outline-none"
            />
            <ul className="mt-3 flex flex-col gap-1">
              {draft.checks.map((check) => (
                <li key={check} className="flex items-center gap-2 text-sm text-muted">
                  <Check className="size-4 text-accent" aria-hidden="true" />
                  {check}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={approve}
              disabled={finalPost.trim().length < 8}
              className="mt-3 min-h-11 border border-accent px-4 text-sm font-semibold text-fg disabled:opacity-50"
            >
              Approve this post
            </button>
          </article>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
        <div className="border border-line bg-surface p-4">
          <p className="text-xs font-medium tracking-widest text-muted uppercase">Growth check</p>
          <h3 className="mt-1 font-display text-3xl">{growth.label}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{growth.detail}</p>
          <p className="mt-2 text-xs text-muted">Score is saves × 3 + clicks × 4 + follows × 5. Reach is logged, not worshipped.</p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(
              [
                ["Reach", reach, setReach],
                ["Saves", saves, setSaves],
                ["Follows", follows, setFollows],
                ["Clicks", clicks, setClicks],
              ] as const
            ).map(([label, value, setValue]) => (
              <label key={label} className="flex flex-col gap-1 text-sm">
                <span className="text-xs tracking-widest text-muted uppercase">{label}</span>
                <input
                  inputMode="numeric"
                  value={value}
                  onChange={(event) => setValue(event.target.value.replace(/[^\d]/g, "").slice(0, 7))}
                  className="min-h-11 border border-line bg-bg px-3 text-fg outline-none"
                />
              </label>
            ))}
          </div>
          <label className="mt-3 flex flex-col gap-1 text-sm">
            <span className="text-xs tracking-widest text-muted uppercase">What changed</span>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={140}
              placeholder="First line was the deadline, not the logo"
              className="min-h-11 border border-line bg-bg px-3 text-fg outline-none"
            />
          </label>
          <button type="button" onClick={logGrowth} className="mt-3 min-h-11 bg-accent px-4 text-sm font-semibold text-ink">
            Log growth
          </button>
        </div>
        <div className="border border-line p-4">
          <p className="text-xs font-medium tracking-widest text-muted uppercase">Last logs</p>
          {recent.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nothing logged yet.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {recent.map((log) => (
                <li key={log.id} className="text-sm">
                  <span className="text-muted">{log.date}</span> {channelById(log.channel).label} · {log.saves} saves · {log.clicks} clicks
                </li>
              ))}
            </ul>
          )}
          {store.posts[0] ? (
            <p className="mt-4 text-xs leading-relaxed text-muted">Last approved: {store.posts[0].date} · {channelById(store.posts[0].channel).label}</p>
          ) : null}
        </div>
      </section>

      <section>
        <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Marketing research">
          {(
            [
              ["wants", "What they want"],
              ["bias", "Industry bias"],
              ["tools", "Tools on the market"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={panel === id}
              onClick={() => setPanel(id)}
              className={
                "min-h-11 border px-2 py-2 text-sm " +
                (panel === id ? "border-accent bg-accent text-ink" : "border-line bg-surface text-fg")
              }
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2" role="tabpanel">
          {panel === "wants"
            ? BUSINESS_WANTS.map((item) => (
                <article key={item.title} className="border border-line bg-surface p-4">
                  <h3 className="font-display text-2xl">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.detail}</p>
                </article>
              ))
            : null}
          {panel === "bias"
            ? INDUSTRY_BIASES.map((item) => (
                <article key={item.title} className="border border-line bg-surface p-4">
                  <h3 className="font-display text-2xl">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.refuse}</p>
                </article>
              ))
            : null}
          {panel === "tools"
            ? MARKET_TOOLS.map((tool) => (
                <article key={tool.name} className="border border-line bg-surface p-4">
                  <h3 className="font-display text-2xl">{tool.name}</h3>
                  <p className="mt-2 text-sm">{tool.fit}</p>
                  <p className="mt-1 text-sm text-muted">{tool.price}</p>
                  <p className="mt-2 text-sm text-accent">{tool.gap}</p>
                </article>
              ))
            : null}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Tool prices are October 2026 public bands, not a quote. This desk is the daily instruction and the growth check. Buffer, Hootsuite, Sprout, Later, Ocoya, Predis, and Lately still own scheduling and publishing.
        </p>
      </section>
    </div>
  );
}
