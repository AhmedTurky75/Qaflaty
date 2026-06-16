# AI Shopping Assistant — Phase 1 (Core)

This document describes the AI shopping assistant feature added to Qaflaty. It covers the
backend architecture, configuration, API surface, the storefront/merchant integration, and
the **required database migration** step.

## Scope delivered

A backend + frontend vertical slice of "Phase 1":

- **Merchant configuration** — a new `AiAssistantSettings` value object on `StoreConfiguration`
  (enable, disable-human-chat, assistant name, welcome message, personality, language,
  active hours, max conversation length) editable from a new **AI Assistant** settings page.
- **Knowledge sources + embeddings** — a "Refresh AI Knowledge" merchant action embeds the
  store profile, contact/social info, published FAQ, and active products into an in-memory
  per-store vector store.
- **RAG chat** — when enabled, the assistant answers storefront chat messages using
  retrieval-augmented generation, persisted as `Bot` messages on the existing
  `ChatConversation` aggregate and delivered over the existing SignalR `/hubs/chat`.
- **Status/insights** — a status endpoint surfaces knowledge counts and service availability.

### Deferred (future phases)

Cart add-to-cart actions / function calling, customer-information collection, the full
analytics dashboard and widgets, offers/orders/customer-history embeddings, and omnichannel
(WhatsApp/Messenger) integration. The design leaves room for these (see interfaces below).

## Architecture

The plan referenced Semantic Kernel; this implementation instead uses a thin,
provider-agnostic abstraction over an **OpenAI-compatible** endpoint (e.g. LM Studio). This
keeps the dependency surface small and lets us swap in Semantic Kernel later behind the same
interfaces.

### Application layer (interfaces)

- `IAiChatCompletionService` — chat completion (`/chat/completions`).
- `IAiEmbeddingService` — embeddings (`/embeddings`).
- `IAiKnowledgeStore` — in-memory, per-store vector store with cosine-similarity search.
- `AiPromptBuilder` — builds the grounded system prompt (no hallucination, no unauthorized
  actions, prompt-injection resistance, tenant isolation).
- `AiKnowledgeContentBuilder` — turns store/FAQ/product data into embeddable text drafts.

### Infrastructure layer (implementations)

- `OpenAiCompatibleChatCompletionService` / `OpenAiCompatibleEmbeddingService` — typed
  `HttpClient`s configured from the `AiAssistant` options.
- `InMemoryAiKnowledgeStore` — singleton, partitioned by `storeId` for strict tenant
  isolation; rebuilt on each "Refresh AI Knowledge".

### CQRS

- `RefreshAiKnowledgeCommand` → rebuilds the vector store, returns embed counts.
- `GenerateAiReplyCommand` → RAG reply to the latest customer message, persisted as a Bot
  message.
- `GetAiAssistantStatusQuery` → settings + knowledge stats + service availability.

### RAG flow

```
Customer message → embed query → search store vector store → inject top matches into
system prompt → chat completion → persist Bot message → broadcast over SignalR
```

If no relevant knowledge is found, the assistant replies:
`I couldn't find that information in the store catalog.`

## Configuration

`appsettings.json` (`AiAssistant` section). Point `Endpoint` at an OpenAI-compatible server
such as a local LM Studio instance. **Leaving `Endpoint` empty disables the AI service**
(`IsConfigured == false`); the assistant settings can still be saved but replies/refresh will
return `Ai.NotConfigured`.

```json
"AiAssistant": {
  "Endpoint": "http://localhost:1234/v1",
  "ApiKey": "lm-studio",
  "ChatModel": "Qwen2.5-0.5B-Instruct",
  "EmbeddingModel": "nomic-embed-text-v1.5",
  "TimeoutSeconds": 60
}
```

## API

Merchant (`CanManageStore`):

- `GET  /api/stores/{storeId}/ai-assistant/status`
- `POST /api/stores/{storeId}/ai-assistant/refresh-knowledge`
- AI settings are saved via the existing `PUT /api/stores/{storeId}/configuration`
  (now includes `aiAssistantSettings`).

Storefront:

- `POST /api/storefront/chat/conversations/{id}/ai-reply` (HTTP fallback)
- SignalR hub method `RequestAiReply(conversationId)` on `/hubs/chat`

## Frontend

- **Merchant**: new **AI Assistant** page under Store Builder (`/store-builder/ai-assistant`)
  with settings form, knowledge stats, and a **Refresh AI Knowledge** button.
- **Store**: the chat widget shows when live chat **or** the AI assistant is enabled. After a
  customer message it calls `RequestAiReply`; the Bot reply arrives via `ReceiveMessage`.

## Required database migration

A new owned value object adds columns to `store_configurations`
(`ai_enabled`, `ai_disable_human_chat`, `ai_assistant_name`, `ai_welcome_message`,
`ai_personality`, `ai_language`, `ai_enabled_hours_start`, `ai_enabled_hours_end`,
`ai_max_conversation_length`).

This sandbox has no .NET SDK, so the migration was **not** generated here. Run locally:

```bash
dotnet ef migrations add AddAiAssistantSettings \
  --project src/Qaflaty.Infrastructure --startup-project src/Qaflaty.Api
dotnet ef database update \
  --project src/Qaflaty.Infrastructure --startup-project src/Qaflaty.Api
```

> **Existing rows:** the non-nullable columns need defaults so existing `store_configurations`
> rows remain valid. Review the generated migration and ensure these defaults are applied
> (EF may emit them without one):
> `ai_enabled = false`, `ai_disable_human_chat = false`,
> `ai_personality = 'Friendly'`, `ai_language = 'AutoDetect'`,
> `ai_max_conversation_length = 50`.

## Security & governance

- Tenant isolation: knowledge is partitioned by `storeId`; `GenerateAiReply` verifies the
  conversation belongs to the requesting store.
- No hallucination: replies are grounded only in retrieved store knowledge.
- No unauthorized actions: the assistant only suggests cart/order actions; it never performs
  them.
- Prompt-injection resistance baked into the system prompt.
- Input length is bounded (existing 2000-char message limit; query/answer truncated).

## Testing performed

- Angular `shared`, `merchant`, and `store` projects build cleanly with the new types and
  components (`ng build`).
- Backend could not be compiled in this environment (no .NET SDK; SDK download hosts blocked).
  Build/`dotnet test` and the migration must be run locally.
