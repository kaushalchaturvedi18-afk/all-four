# All Four

ChatGPT, Claude, Copilot, and Grok on one desk. Each seat covers a weakness the others leave open. Four home cards: Team, Gaps, Today, and Marketing Manager. The marketing card is one daily post instruction, a four-seat draft, and a growth check. See docs/MARKETING.md. The n8n Agents card calls a production webhook you paste; it does not log into n8n.

Grok writes the four seats. The other names are roles on the desk, not live calls to those companies.

## Run

```bash
npm install
npm run dev
```

The app listens on port 8080. `XAI_API_KEY` is read on the server only. If it is missing, the desk still runs from its local draft.
