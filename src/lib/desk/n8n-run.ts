import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  checkWebhookUrl,
  isPrivateAddress,
  parseAgentReply,
  type AgentJobId,
} from "@/lib/desk/n8n";

const inputSchema = z.object({
  webhookUrl: z.string().min(12).max(500),
  message: z.string().min(1).max(2000),
  agent: z.enum(["daily-post", "growth", "remind"]),
  token: z.string().max(200).optional(),
});

export type N8nRun =
  | { ok: true; text: string; body: string }
  | { ok: false; error: string };

export const runN8nAgent = createServerFn({ method: "POST" })
  .validator(inputSchema)
  .handler(async ({ data }): Promise<N8nRun> => {
    const checked = checkWebhookUrl(data.webhookUrl);
    if (!checked.ok) return { ok: false, error: checked.error };
    const url = new URL(checked.href);
    try {
      const { lookup } = await import("node:dns/promises");
      const records = await lookup(url.hostname, { all: true, verbatim: true });
      if (records.length === 0) return { ok: false, error: "That webhook host did not resolve." };
      if (records.some((record) => isPrivateAddress(record.address))) {
        return { ok: false, error: "That webhook host points at a private address." };
      }
    } catch {
      return { ok: false, error: "That webhook host did not resolve." };
    }

    const headers: Record<string, string> = { "content-type": "application/json" };
    const token = data.token?.trim();
    if (token) headers["x-all-four-token"] = token;

    let response: Response;
    try {
      response = await fetch(checked.href, {
        method: "POST",
        redirect: "manual",
        headers,
        body: JSON.stringify({
          source: "all-four",
          agent: data.agent as AgentJobId,
          message: data.message.trim(),
        }),
        signal: AbortSignal.timeout(12_000),
      });
    } catch {
      return { ok: false, error: "n8n did not answer in time." };
    }

    if (response.status >= 300 && response.status < 400) {
      return { ok: false, error: "The webhook tried to redirect. That is refused." };
    }
    if (!response.ok) {
      return { ok: false, error: `n8n answered ${response.status}. Check the workflow is active.` };
    }

    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > 32_000) return { ok: false, error: "The reply was too large." };
    const body = new TextDecoder().decode(bytes);
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("html")) {
      return { ok: false, error: "n8n returned a page, not an agent reply." };
    }
    try {
      return { ok: true, text: parseAgentReply(body, contentType), body };
    } catch (error) {
      const message = error instanceof Error ? error.message : "The reply could not be read.";
      return { ok: false, error: message };
    }
  });
