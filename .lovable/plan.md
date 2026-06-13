## Change

In `src/routes/api/chat.ts`, swap the model string:

- From: `gateway("anthropic/claude-sonnet-4-5")`
- To: `gateway("google/gemini-3-flash-preview")`

## Streaming note

Token streaming is already in place — the route uses `streamText(...)` + `result.toUIMessageStreamResponse(...)`, and the client uses `useChat` with `DefaultChatTransport` pointed at `/api/chat`. Tokens render incrementally via `message.parts` as they arrive; no polling or post-completion fetch is involved.

The existing `onFinish` callback (which persists the final user/assistant messages and parses `<auto_log>` into an entry) runs after the stream completes and does not block streaming to the UI. No changes needed there.

## Verification

After the swap, send a message in `/chat/:threadId` and confirm the assistant bubble fills in token-by-token.
