import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import {
  AGENT_JOBS,
  TEAM_CALLS,
  buildPayload,
  checkWebhookUrl,
  readGrowthFigures,
  starterWorkflow,
  type AgentJobId,
} from "@/lib/desk/n8n";
import { runN8nAgent } from "@/lib/desk/n8n-run";

type Saved = Record<AgentJobId, { webhookUrl: string; token: string }>;

const STORAGE_KEY = "all-four.n8n.v1";
const EMPTY: Saved = {
  "daily-post": { webhookUrl: "", token: "" },
  growth: { webhookUrl: "", token: "" },
  remind: { webhookUrl: "", token: "" },
};

function loadSaved(): Saved {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Saved>;
    return {
      "daily-post": { ...EMPTY["daily-post"], ...parsed["daily-post"] },
      growth: { ...EMPTY.growth, ...parsed.growth },
      remind: { ...EMPTY.remind, ...parsed.remind },
    };
  } catch {
    return EMPTY;
  }
}

export function N8nDesk() {
  const [saved, setSaved] = useState<Saved>(EMPTY);
  const [ready, setReady] = useState(false);
  const [job, setJob] = useState<AgentJobId>("daily-post");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [figures, setFigures] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSaved(loadSaved());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }, [saved, ready]);

  const current = AGENT_JOBS.find((item) => item.id === job) ?? AGENT_JOBS[0];
  const slot = saved[job];
  const check = slot.webhookUrl.trim() ? checkWebhookUrl(slot.webhookUrl) : null;

  function update(patch: Partial<Saved[AgentJobId]>) {
    setSaved((prev) => ({ ...prev, [job]: { ...prev[job], ...patch } }));
  }

  async function send() {
    if (!check || !check.ok || message.trim().length < 1 || busy) return;
    setBusy(true);
    setError("");
    setReply("");
    setFigures("");
    try {
      const result = await runN8nAgent({
        data: {
          webhookUrl: check.href,
          message: message.trim(),
          agent: job,
          token: slot.token.trim() || undefined,
        },
      });
      if (!result.ok) {
        setError(result.error);
      } else {
        setReply(result.text);
        const growth = readGrowthFigures(result.body);
        if (growth) {
          setFigures(
            `${growth.reach} reach · ${growth.saves} saves · ${growth.follows} follows · ${growth.clicks} clicks`,
          );
        }
      }
    } catch {
      setError("The desk could not reach n8n.");
    } finally {
      setBusy(false);
    }
  }

  async function copyWorkflow() {
    const json = JSON.stringify(starterWorkflow(current), null, 2);
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="border border-line bg-surface p-4">
        <p className="text-xs font-medium tracking-widest text-muted uppercase">Team call</p>
        <h2 className="mt-1 font-display text-3xl">n8n runs outside. This desk decides.</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          The agents you built in n8n are not in the GitHub repos, so they cannot be imported from there.
          Paste each production webhook. ChatGPT, Claude, Copilot, and Grok stay roles on this desk. They do not call those companies.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {TEAM_CALLS.map((item) => (
            <li key={item.seat} className="border border-line bg-bg px-3 py-3">
              <p className="text-xs tracking-widest text-muted uppercase">
                {item.seat} · {item.role}
              </p>
              <p className="mt-2 text-sm leading-relaxed">{item.call}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-2 sm:grid-cols-3" role="tablist" aria-label="n8n agents">
        {AGENT_JOBS.map((item) => {
          const on = job === item.id;
          const linked = checkWebhookUrl(saved[item.id].webhookUrl).ok;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => {
                setJob(item.id);
                setReply("");
                setError("");
                setFigures("");
              }}
              className={
                "min-h-11 border px-3 py-2 text-left " +
                (on ? "border-accent bg-accent text-ink" : "border-line bg-surface text-fg")
              }
            >
              <span className="block text-sm font-semibold">{item.name}</span>
              <span className={"mt-0.5 block text-xs " + (on ? "text-ink" : "text-muted")}>
                {linked ? "Webhook saved" : "Not connected"}
              </span>
            </button>
          );
        })}
      </div>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
        <div className="flex flex-col gap-3 border border-line bg-surface p-4">
          <h3 className="font-display text-3xl">{current.name}</h3>
          <p className="text-sm leading-relaxed text-muted">{current.does}</p>
          <p className="text-sm">{current.when}</p>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs tracking-widest text-muted uppercase">Production webhook</span>
            <input
              value={slot.webhookUrl}
              onChange={(event) => update({ webhookUrl: event.target.value })}
              placeholder="https://your-name.app.n8n.cloud/webhook/…"
              autoComplete="off"
              spellCheck={false}
              className="min-h-11 border border-line bg-bg px-3 text-fg outline-none"
            />
          </label>
          {check && !check.ok ? <p className="text-sm text-accent">{check.error}</p> : null}
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs tracking-widest text-muted uppercase">Header token, optional</span>
            <input
              value={slot.token}
              onChange={(event) => update({ token: event.target.value })}
              type="password"
              autoComplete="off"
              placeholder="Sent only as X-All-Four-Token"
              className="min-h-11 border border-line bg-bg px-3 text-fg outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs tracking-widest text-muted uppercase">Instruction</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              maxLength={2000}
              placeholder={
                job === "growth"
                  ? "Pull yesterday’s counts for the approved post."
                  : "What should this agent do with today’s one post?"
              }
              className="w-full resize-none border border-line bg-bg px-3 py-3 text-sm leading-relaxed text-fg outline-none"
            />
          </label>
          <button
            type="button"
            onClick={send}
            disabled={busy || !check?.ok || message.trim().length < 1}
            className="min-h-11 bg-accent px-4 text-sm font-semibold text-ink disabled:opacity-50"
          >
            {busy ? "Asking n8n" : "Send to this agent"}
          </button>
          {error ? <p className="text-sm text-accent">{error}</p> : null}
          {reply ? (
            <article className="rise border border-accent bg-bg p-4">
              <p className="text-xs tracking-widest text-accent uppercase">Reply</p>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{reply}</p>
              {figures ? <p className="mt-3 text-sm text-muted">{figures}</p> : null}
              <p className="mt-3 text-xs text-muted">Nothing is published. Approve it yourself.</p>
            </article>
          ) : null}
        </div>

        <aside className="flex flex-col gap-3 border border-line p-4">
          <p className="text-xs font-medium tracking-widest text-muted uppercase">What we send</p>
          <pre className="overflow-x-auto text-xs leading-relaxed text-muted">
            {JSON.stringify(buildPayload(job, message || "…"), null, 2)}
          </pre>
          <p className="text-sm leading-relaxed text-muted">
            In n8n, answer with JSON <span className="text-fg">text</span>, or with reach, saves, follows, and clicks.
            Swap the starter’s respond node for your Agent node when you are ready.
          </p>
          <button
            type="button"
            onClick={copyWorkflow}
            className="inline-flex min-h-11 items-center justify-center gap-2 border border-line px-3 text-sm"
          >
            {copied ? <Check className="size-4 text-accent" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
            {copied ? "Copied" : "Copy starter workflow"}
          </button>
        </aside>
      </section>
    </div>
  );
}
