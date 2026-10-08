export type AgentJobId = "daily-post" | "growth" | "remind";

export type AgentJob = {
  id: AgentJobId;
  name: string;
  does: string;
  when: string;
};

export const AGENT_JOBS: AgentJob[] = [
  {
    id: "daily-post",
    name: "Daily post",
    does: "Takes today’s instruction and returns one caption. A person still approves it on this desk.",
    when: "Run it when you press Send, not on a hidden timer.",
  },
  {
    id: "growth",
    name: "Growth pull",
    does: "n8n keeps the social logins and returns reach, saves, follows, and clicks. This desk never stores those logins.",
    when: "Run it the morning after a post.",
  },
  {
    id: "remind",
    name: "One-post reminder",
    does: "n8n’s own schedule can ping you if today has no approved post. This desk does not send the message.",
    when: "Set the hour inside n8n. Use the webhook here only for a manual ping.",
  },
];

export const TEAM_CALLS: { seat: string; role: string; call: string }[] = [
  {
    seat: "ChatGPT",
    role: "Clarity",
    call: "This desk owns the instruction and the approval. n8n only talks to systems outside the books.",
  },
  {
    seat: "Claude",
    role: "Care",
    call: "Do not send books, TRN, client files, or passwords. Marketing text and public counts only.",
  },
  {
    seat: "Copilot",
    role: "Build",
    call: "One https call from our server, path must be an n8n webhook. The reply is text. It never writes a journal.",
  },
  {
    seat: "Grok",
    role: "Edge",
    call: "Three agents, not an n8n editor inside the app. If the webhook is down, draft the post here anyway.",
  },
];

export type WebhookCheck = { ok: true; href: string } | { ok: false; error: string };

function isPrivateIp(host: string): boolean {
  const bare = host.replace(/^\[|\]$/g, "");
  const v4 = bare.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const parts = v4.slice(1).map(Number);
    if (parts.some((n) => n > 255)) return true;
    const a = parts[0] ?? 0;
    const b = parts[1] ?? 0;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }
  const lower = bare.toLowerCase();
  if (lower === "::1" || lower === "0:0:0:0:0:0:0:1") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80")) return true;
  return false;
}

const BLOCKED_HOST =
  /^(localhost|metadata|metadata\.google\.internal|host\.docker\.internal)$/i;

export function checkWebhookUrl(raw: string): WebhookCheck {
  const text = raw.trim();
  if (text.length < 12 || text.length > 500) {
    return { ok: false, error: "Paste the full n8n production webhook address." };
  }
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return { ok: false, error: "That is not a web address." };
  }
  if (url.protocol !== "https:") return { ok: false, error: "The webhook must be https." };
  if (url.username || url.password) {
    return { ok: false, error: "Put the token in the header field, not in the address." };
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (!host || BLOCKED_HOST.test(host) || host.endsWith(".local") || host.endsWith(".internal")) {
    return { ok: false, error: "That host is not a public n8n webhook." };
  }
  if (isPrivateIp(host)) return { ok: false, error: "Private addresses are refused." };
  if (!/\/webhook(?:-test)?(\/|$)/.test(url.pathname)) {
    return { ok: false, error: "Use the n8n production URL. The path must contain /webhook." };
  }
  return { ok: true, href: url.toString() };
}

export function isPrivateAddress(address: string): boolean {
  return isPrivateIp(address);
}

export type AgentPayload = {
  source: "all-four";
  agent: AgentJobId;
  message: string;
};

export function buildPayload(agent: AgentJobId, message: string): AgentPayload {
  return { source: "all-four", agent, message: message.trim() };
}

export function parseAgentReply(body: string, contentType: string): string {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("n8n returned an empty reply.");
  const looksJson =
    contentType.toLowerCase().includes("json") || trimmed.startsWith("{") || trimmed.startsWith("[");
  if (!looksJson) return trimmed.slice(0, 4000);
  let data: unknown;
  try {
    data = JSON.parse(trimmed);
  } catch {
    throw new Error("n8n returned JSON that could not be read.");
  }
  const text = pickText(data);
  if (!text) throw new Error("Reply had no text, output, or caption field.");
  return text.slice(0, 4000);
}

function pickText(data: unknown): string | null {
  if (typeof data === "string" && data.trim()) return data.trim();
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  for (const key of ["text", "output", "caption", "message", "response"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  if ("data" in record) return pickText(record.data);
  return null;
}

export type GrowthFigures = {
  reach: number;
  saves: number;
  follows: number;
  clicks: number;
};

export function readGrowthFigures(body: string): GrowthFigures | null {
  try {
    const data = JSON.parse(body) as Record<string, unknown>;
    const bag =
      data && typeof data === "object" && data.data && typeof data.data === "object"
        ? (data.data as Record<string, unknown>)
        : data;
    if (!bag || typeof bag !== "object") return null;
    const num = (key: string) => {
      const value = bag[key];
      return typeof value === "number" && Number.isFinite(value) ? value : null;
    };
    const reach = num("reach");
    const saves = num("saves");
    const follows = num("follows");
    const clicks = num("clicks");
    if (reach == null && saves == null && follows == null && clicks == null) return null;
    return {
      reach: reach ?? 0,
      saves: saves ?? 0,
      follows: follows ?? 0,
      clicks: clicks ?? 0,
    };
  } catch {
    return null;
  }
}

export function starterWorkflow(job: AgentJob): unknown {
  const path = `all-four-${job.id}`;
  return [
    {
      name: `All Four — ${job.name}`,
      nodes: [
        {
          parameters: {
            httpMethod: "POST",
            path,
            responseMode: "responseNode",
            options: {},
          },
          id: "a14f0001-0000-4000-8000-000000000001",
          name: "Webhook",
          type: "n8n-nodes-base.webhook",
          typeVersion: 2,
          position: [260, 300],
          webhookId: path,
        },
        {
          parameters: {
            respondWith: "json",
            responseBody:
              '={{ { "text": "Received: " + ($json.body.message || ""), "source": "n8n", "agent": $json.body.agent } }}',
          },
          id: "a14f0001-0000-4000-8000-000000000002",
          name: "Respond to Webhook",
          type: "n8n-nodes-base.respondToWebhook",
          typeVersion: 1.1,
          position: [560, 300],
        },
      ],
      connections: {
        Webhook: {
          main: [[{ node: "Respond to Webhook", type: "main", index: 0 }]],
        },
      },
      settings: { executionOrder: "v1" },
    },
  ];
}
