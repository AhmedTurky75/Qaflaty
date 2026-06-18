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

### Also delivered (follow-up)

- **Cart actions** — AI replies carry suggested products (derived from retrieved product
  knowledge). The storefront renders them as cards with an explicit **Add to cart** button;
  the assistant never modifies the cart itself (confirmation required by design).
- **Analytics dashboard** — AI interactions are logged to `ai_interaction_logs` and surfaced
  as merchant dashboard widgets (conversations, cart additions, products recommended,
  conversion, top questions, product interest, knowledge gaps).
- **Assistant order placement** — the assistant collects the customer's contact + address in
  an in-chat form and places the order from the current cart. Such orders are stamped
  `Source = ChatAssistant` and shown with a "Placed by chat bot" badge in the merchant orders
  UI; an `OrderPlaced` analytics event is recorded.

### Deferred (future phases)

Customer-information collection, offers/orders/customer-history embeddings, and omnichannel
(WhatsApp/Messenger) integration. The design leaves room for these (see interfaces below).

## Cart actions

`GenerateAiReplyCommand` returns an `AiReplyDto { message, suggestedProducts[] }`. Suggested
products come from the in-stock product documents retrieved during RAG (top 3), including
name, slug, price, currency and image. Delivery:

- SignalR: the Bot message arrives via `ReceiveMessage`; suggestions via an `AiSuggestedProducts`
  event keyed by message id.
- HTTP: `POST /api/storefront/chat/conversations/{id}/ai-reply` returns the full `AiReplyDto`.

The storefront adds the product through the existing cart API on explicit click, then calls
`POST /api/storefront/chat/conversations/{id}/ai-cart-added` to record the influenced sale.

## Analytics

`AiInteractionLog` (table `ai_interaction_logs`) records three event types: `Reply`
(with retrieved-document count for knowledge-gap detection), `ProductSuggested`, and `CartAdd`.
`GET /api/stores/{storeId}/ai-assistant/analytics` aggregates a rolling 30-day window into
`AiAnalyticsDto` (usage, sales influence, conversion, top questions, product interest, and
knowledge-gap questions) shown on the merchant AI Assistant page.

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

Two schema changes are introduced:

1. A new owned value object adds columns to `store_configurations`
   (`ai_enabled`, `ai_disable_human_chat`, `ai_assistant_name`, `ai_welcome_message`,
   `ai_personality`, `ai_language`, `ai_enabled_hours_start`, `ai_enabled_hours_end`,
   `ai_max_conversation_length`).
2. A new `ai_interaction_logs` table (analytics) with columns `id`, `store_id`,
   `conversation_id`, `event_type`, `query`, `product_id`, `documents_retrieved`, `created_at`
   and indexes on `(store_id, created_at)` and `(store_id, event_type)`.
3. A new `source` column on `orders` (string, e.g. `Storefront` / `ChatAssistant`).
   Existing rows must default to `Storefront`.

This sandbox has no .NET SDK, so the migration was **not** generated here. A single
`dotnet ef migrations add` run will capture both changes:

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
> `ai_max_conversation_length = 50`, and `orders.source = 'Storefront'`.

## Security & governance

- Tenant isolation: knowledge is partitioned by `storeId`; `GenerateAiReply` verifies the
  conversation belongs to the requesting store.
- No hallucination: replies are grounded only in retrieved store knowledge.
- Relevance gate / abuse protection: if a question retrieves no store knowledge above the
  similarity threshold, the assistant returns the canned out-of-scope reply **without calling
  the LLM**. This keeps it on-topic (it won't answer general-knowledge questions like
  "capital of France") and prevents off-topic/abusive prompts from consuming chat tokens.
- No unauthorized actions: the assistant only suggests cart/order actions; it never performs
  them.
- Prompt-injection resistance baked into the system prompt.
- Input length is bounded (existing 2000-char message limit; query/answer truncated).

## Testing performed

- Angular `shared`, `merchant`, and `store` projects build cleanly with the new types and
  components (`ng build`).
- A `tests/Qaflaty.UnitTests` xUnit project covers the pure-logic surface (no DB/LLM needed):
  `AiAssistantSettings` (defaults, normalization, active-hours incl. overnight),
  `InMemoryAiKnowledgeStore` (cosine ranking, top-K, min-score, tenant isolation, stats),
  `AiPromptBuilder` (guardrails, persona/language, retrieved-context injection), and
  `GetAiAnalyticsQueryHandler` (metric aggregation). Run with `dotnet test`.
- Backend could not be compiled in this environment (no .NET SDK; SDK download hosts blocked).
  Build/`dotnet test` and the migration must be run locally.
