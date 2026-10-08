import assert from "node:assert/strict";
import test from "node:test";
import { checkWebhookUrl, parseAgentReply, readGrowthFigures } from "./n8n.ts";

test("rejects private and non-webhook addresses", () => {
  assert.equal(checkWebhookUrl("http://example.com/webhook/a").ok, false);
  assert.equal(checkWebhookUrl("https://127.0.0.1/webhook/a").ok, false);
  assert.equal(checkWebhookUrl("https://example.com/health").ok, false);
  assert.equal(checkWebhookUrl("https://name.app.n8n.cloud/webhook/all-four-daily-post").ok, true);
});

test("reads the agent text field", () => {
  assert.equal(parseAgentReply('{"text":"One post."}', "application/json"), "One post.");
  const figures = readGrowthFigures('{"reach":10,"saves":2,"follows":1,"clicks":3}');
  assert.deepEqual(figures, { reach: 10, saves: 2, follows: 1, clicks: 3 });
});
