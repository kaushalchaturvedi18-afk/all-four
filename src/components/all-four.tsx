import { useEffect, useMemo, useState } from "react";
import { Check, Minus } from "lucide-react";
import { localRun, type DeskRun } from "@/lib/desk/local-run";
import { runDesk } from "@/lib/desk/run-desk";
import { GAPS, MISSIONS, SEATS, seatById, type SeatId } from "@/lib/desk/roster";
import { MarketingManager } from "@/components/marketing-manager";
import { N8nDesk } from "@/components/n8n-desk";

type Mode = "team" | "gaps" | "today" | "marketing" | "n8n";
type Note = "idle" | "draft" | "live" | "desk";

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "team", label: "Team", hint: "One brief, four seats" },
  { id: "gaps", label: "Gaps", hint: "Turn weaknesses off" },
  { id: "today", label: "Today", hint: "Ship before the day ends" },
  { id: "marketing", label: "Marketing Manager", hint: "One post a day. Check growth." },
  { id: "n8n", label: "n8n Agents", hint: "Outside agents. You still approve." },
];

const BEATS = ["Brief", "Seats", "Clash", "Ship"];

export function AllFour() {
  const [mode, setMode] = useState<Mode>("team");
  const [brief, setBrief] = useState(MISSIONS[0].brief);
  const [run, setRun] = useState<DeskRun | null>(null);
  const [note, setNote] = useState<Note>("idle");
  const [busy, setBusy] = useState(false);
  const [beat, setBeat] = useState(0);
  const [clock, setClock] = useState("—");
  const [on, setOn] = useState<Record<SeatId, boolean>>({
    chatgpt: true,
    claude: true,
    copilot: true,
    grok: true,
  });

  useEffect(() => {
    const format = () =>
      new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(new Date());
    setClock(format());
    const id = window.setInterval(() => setClock(format()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!busy) return;
    setBeat(1);
    const id = window.setInterval(() => {
      setBeat((current) => (current >= 4 ? 4 : current + 1));
    }, 420);
    return () => window.clearInterval(id);
  }, [busy]);

  async function launch(nextBrief: string) {
    const text = nextBrief.trim();
    if (text.length < 8 || busy) return;
    setBrief(text);
    setRun(localRun(text));
    setNote("draft");
    setBusy(true);
    try {
      const res = await runDesk({ data: { brief: text } });
      if (res.ok) {
        setRun(res.run);
        setNote(res.source === "grok" ? "live" : "desk");
      } else {
        setNote("desk");
      }
    } catch {
      setNote("desk");
    } finally {
      setBeat(4);
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="text-xs font-medium tracking-widest text-muted uppercase">Desk</p>
          <h1 className="font-display text-5xl leading-none text-fg sm:text-6xl">All Four</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
            ChatGPT, Claude, Copilot, and Grok. Each one is weak alone. Together the open list hits zero, and you ship today.
          </p>
        </div>
        <p className="font-display text-3xl tabular-nums text-fg">{clock}</p>
      </header>

      <nav className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-label="Home cards">
        {MODES.map((item) => {
          const active = mode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => setMode(item.id)}
              className={
                "min-h-11 border px-3 py-2 text-left " +
                (active
                  ? "border-accent bg-accent text-ink"
                  : "border-line bg-surface text-fg hover:border-fg")
              }
            >
              <span className="block text-sm font-semibold">{item.label}</span>
              <span className={"mt-0.5 block text-xs " + (active ? "text-ink" : "text-muted")}>
                {item.hint}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-6">
        {mode === "n8n" ? (
          <N8nDesk />
        ) : mode === "marketing" ? (
          <MarketingManager />
        ) : mode === "gaps" ? (
          <GapsBoard on={on} setOn={setOn} />
        ) : (
          <Work
            mode={mode === "today" ? "today" : "team"}
            brief={brief}
            setBrief={setBrief}
            run={run}
            note={note}
            busy={busy}
            beat={mode === "today" ? beat : busy ? beat : run ? 4 : 0}
            onLaunch={launch}
          />
        )}
      </div>

      <footer className="mt-10 border-t border-line pt-4 text-xs leading-relaxed text-muted">
        Grok writes the four seats from this desk. ChatGPT, Claude, and Copilot are roles here, not live calls to those companies. Their gaps are how this desk assigns the work.
      </footer>
    </main>
  );
}

function Work({
  mode,
  brief,
  setBrief,
  run,
  note,
  busy,
  beat,
  onLaunch,
}: {
  mode: "team" | "today";
  brief: string;
  setBrief: (value: string) => void;
  run: DeskRun | null;
  note: Note;
  busy: boolean;
  beat: number;
  onLaunch: (brief: string) => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
      <section className="flex flex-col gap-4">
        {mode === "today" ? (
          <ol className="grid grid-cols-4 gap-2" aria-label="Ship beats">
            {BEATS.map((label, index) => {
              const filled = beat > index;
              return (
                <li
                  key={label}
                  className={
                    "border px-2 py-3 text-center text-xs font-medium tracking-wide uppercase " +
                    (filled ? "border-accent bg-accent text-ink" : "border-line text-muted")
                  }
                >
                  {label}
                </li>
              );
            })}
          </ol>
        ) : null}

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium tracking-widest text-muted uppercase">
            {mode === "today" ? "Missions for today" : "Or start from a mission"}
          </p>
          <div className="flex flex-col gap-2">
            {MISSIONS.map((mission) => {
              const active = brief === mission.brief;
              return (
                <button
                  key={mission.id}
                  type="button"
                  onClick={() => onLaunch(mission.brief)}
                  className={
                    "min-h-11 border px-3 py-2 text-left text-sm " +
                    (active
                      ? "border-fg bg-raised text-fg"
                      : "border-line bg-surface text-fg hover:border-fg")
                  }
                >
                  {mission.title}
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium tracking-widest text-muted uppercase">Brief</span>
          <textarea
            value={brief}
            onChange={(event) => setBrief(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                onLaunch(brief);
              }
            }}
            rows={5}
            maxLength={700}
            className="w-full resize-none border border-line bg-surface px-3 py-3 text-sm leading-relaxed text-fg outline-none"
            placeholder="What has to be done today?"
          />
        </label>
        <button
          type="button"
          disabled={busy || brief.trim().length < 8}
          onClick={() => onLaunch(brief)}
          className="min-h-11 bg-accent px-4 text-sm font-semibold text-ink disabled:opacity-50"
        >
          {busy ? "Seats are working" : mode === "today" ? "Run today" : "Run the desk"}
        </button>
      </section>

      <section className="min-w-0">
        {run ? <Result run={run} note={note} busy={busy} /> : <Empty mode={mode} />}
      </section>
    </div>
  );
}

function Empty({ mode }: { mode: "team" | "today" }) {
  return (
    <div className="border border-dashed border-line px-5 py-10">
      <p className="font-display text-3xl text-fg">
        {mode === "today" ? "Pick what has to leave today." : "Put the job on the desk."}
      </p>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
        Four seats answer at once. Then the clashes get a call, and the ship list is only what fits today.
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {SEATS.map((seat) => (
          <li key={seat.id} className="border border-line bg-surface px-3 py-3">
            <p className="text-xs tracking-widest text-muted uppercase">
              {seat.mark} {seat.role}
            </p>
            <p className="mt-1 font-display text-2xl">{seat.name}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{seat.owns}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Result({ run, note, busy }: { run: DeskRun; note: Note; busy: boolean }) {
  const status =
    note === "live"
      ? "Grok wrote the four seats."
      : note === "draft" || busy
        ? "Desk draft is up. Grok is tightening it."
        : "Desk draft. The four lenses still closed the gaps.";

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">{status}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {SEATS.map((seat, index) => {
          const take = run.seats[seat.id];
          return (
            <article
              key={seat.id}
              className="rise border border-line bg-surface p-4"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <header className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-2xl">{seat.name}</h2>
                <p className="text-xs tracking-widest text-muted uppercase">{seat.role}</p>
              </header>
              <p className="mt-3 text-sm leading-relaxed">{take.take}</p>
              <p className="mt-3 text-sm font-medium text-accent">Today — {take.move}</p>
            </article>
          );
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="border border-line bg-raised p-4">
          <h2 className="text-xs font-medium tracking-widest text-muted uppercase">Clashes, called</h2>
          <ul className="mt-3 flex flex-col gap-4">
            {run.clashes.map((clash) => (
              <li key={clash.call}>
                <p className="text-sm">{clash.left}</p>
                <p className="mt-1 text-sm text-muted">{clash.right}</p>
                <p className="mt-2 text-sm font-medium text-accent">{clash.call}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="border border-line bg-raised p-4">
          <h2 className="text-xs font-medium tracking-widest text-muted uppercase">Weakness closed</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {run.covers.map((cover) => (
              <li key={cover.gap} className="flex gap-3 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                <span>
                  <span className="text-fg">{cover.gap}</span>
                  <span className="text-muted">
                    {" "}
                    — {seatById(cover.owner).name}, closed by {seatById(cover.closer).name}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="border border-accent bg-surface p-4">
        <h2 className="text-xs font-medium tracking-widest text-accent uppercase">Ship today</h2>
        <ol className="mt-3 flex flex-col gap-2">
          {run.ship.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm">
              <span className="w-6 shrink-0 font-medium tabular-nums text-accent">0{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function GapsBoard({
  on,
  setOn,
}: {
  on: Record<SeatId, boolean>;
  setOn: (next: Record<SeatId, boolean>) => void;
}) {
  const rows = useMemo(() => {
    return GAPS.map((gap) => {
      const exposed = on[gap.exposed];
      const closer = on[gap.closer];
      const state: "closed" | "open" | "benched" = !exposed ? "benched" : closer ? "closed" : "open";
      return { gap, state };
    });
  }, [on]);

  const open = rows.filter((row) => row.state === "open");
  const closed = rows.filter((row) => row.state === "closed");
  const clear = open.length === 0;

  function toggle(id: SeatId) {
    const next = { ...on, [id]: !on[id] };
    if (!SEATS.some((seat) => next[seat.id])) return;
    setOn(next);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
      <section>
        <p className="font-display text-6xl leading-none tabular-nums text-fg">{open.length}</p>
        <p className="mt-2 text-sm text-muted">{open.length === 1 ? "open weakness" : "open weaknesses"}</p>
        <p className={"mt-3 text-sm font-medium " + (clear ? "text-accent" : "text-fg")}>
          {clear ? "Clear. The desk can ship." : "A seat is missing. Their cover is open."}
        </p>
        <ul className="mt-5 flex flex-col gap-2">
          {SEATS.map((seat) => {
            const active = on[seat.id];
            return (
              <li key={seat.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(seat.id)}
                  className={
                    "flex min-h-11 w-full items-center justify-between border px-3 py-2 text-left " +
                    (active ? "border-accent bg-surface text-fg" : "border-line bg-bg text-muted")
                  }
                >
                  <span>
                    <span className="block text-sm font-semibold">{seat.name}</span>
                    <span className="block text-xs">{seat.role}</span>
                  </span>
                  <span className="text-xs tracking-widest uppercase">{active ? "On desk" : "Benched"}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        {open.map(({ gap }) => (
          <article key={gap.id} className="border border-line bg-surface p-4">
            <p className="flex items-center gap-2 text-xs tracking-widest text-muted uppercase">
              <Minus className="size-4" aria-hidden="true" />
              Open
            </p>
            <h2 className="mt-2 font-display text-2xl">{gap.gap}</h2>
            <p className="mt-2 text-sm text-muted">
              {seatById(gap.exposed).name} brings this. {seatById(gap.closer).name} is off the desk, so it stays open.
            </p>
            <p className="mt-2 text-sm">{gap.closerDoes}</p>
          </article>
        ))}
        {closed.map(({ gap }) => (
          <article key={gap.id} className="border border-line px-4 py-3">
            <p className="flex items-center gap-2 text-xs tracking-widest text-accent uppercase">
              <Check className="size-4" aria-hidden="true" />
              Closed by {seatById(gap.closer).name}
            </p>
            <p className="mt-1 text-sm">
              <span className="text-muted line-through">{gap.gap}</span>
            </p>
          </article>
        ))}
        {rows.some((row) => row.state === "benched") ? (
          <p className="text-xs text-muted">
            Benched seats take their own weaknesses with them. They also stop closing anyone else’s.
          </p>
        ) : null}
      </section>
    </div>
  );
}
