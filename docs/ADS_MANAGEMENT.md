# Ads Management — Design Document

Status: **Meta Pixel + Meta CAPI implemented end-to-end.** TikTok, Snapchat, GA4, Google Ads, and GTM are scaffolded behind the same `ITrackingProvider` interface as ready-to-fill adapters.

## 1. Functional Specification

Ads Management gives a merchant automatic, code-free conversion tracking across every ad network that matters, plus the operational tooling (retries, diagnostics, logs, monitoring) needed to trust the numbers.

**Merchant promise:** paste a Pixel ID / access token, click *Verify*, done. No Meta Event Builder, no thank-you-page edits, no `<script>` snippets.

**What the platform does automatically, per store:**
- Detects page type from the storefront route and fires the matching standard event (see §13, Event Lifecycle).
- Sends every event twice when a server channel is enabled — once from the browser (Pixel/gtag/ttq) and once from the server (CAPI/Events API) — sharing one `event_id` so the network's own deduplication merges them (Meta best practice).
- Queues, retries with exponential backoff, and dead-letters events that a provider rejects or times out.
- Surfaces health, diagnostics, and a per-order timeline so the merchant can see *and fix* problems without opening a ticket.

## 2. UX Flow

```
Merchant enables a provider
  └─ Integrations page → "Connect Meta"
       └─ Enter Pixel ID + Access Token + (optional) Test Event Code
       └─ Toggle Browser Tracking / Server Tracking
       └─ Click "Verify Connection"
            ├─ success → card turns green, health score starts populating
            └─ failure → inline reason + "Recommended Fix" (same copy as Diagnostics)
       └─ Click "Send Test Event" → Meta Test Events tab lights up in real time

Customer browses storefront (no merchant action)
  └─ PageView / ViewContent / Search / AddToCart / InitiateCheckout / AddPaymentInfo /
     Purchase / CompleteRegistration / Contact fire automatically from known route/action
     chokepoints (see §13)

Merchant investigates a numbers mismatch
  └─ Dashboard → notices "Failed Events: 12" → Diagnostics page
       └─ Each failing check shows Problem / Reason / Severity / Fix / [Fix button]
  └─ Or: Orders → order detail → Event Timeline tab
       └─ Visitor opened product → ViewContent → AddToCart → Checkout → Purchase →
          Browser Pixel Sent → Server Event Sent → Deduplicated → Meta Accepted
          (each with timestamp + raw provider response)
```

## 3. Wireframes (text)

**Dashboard**
```
┌─ Overall Tracking Status: ● Healthy ───────────────────────────────┐
│ Events Today: 4,281   Purchases: 63   Failed: 12   Pending: 4      │
│ Avg Delivery Time: 340ms                                           │
├──────────────┬──────────────┬──────────────┬───────────────────────┤
│ Meta Pixel   │ Meta CAPI    │ TikTok       │ GA4                   │
│ ✓ Connected  │ ✓ Connected  │ ○ Not set up │ ✓ Connected            │
│ Health: 98%  │ Health: 95%  │              │ Health: 100%           │
│ Last event:  │ Last event:  │              │ Last event: 2m ago     │
│  12s ago     │  14s ago     │              │                        │
│ [Test][⚙]    │ [Test][⚙]    │ [Connect]    │ [Test][⚙]              │
└──────────────┴──────────────┴──────────────┴───────────────────────┘
```

**Integrations → Meta card (expanded)**
```
Meta Pixel & Conversions API
  Pixel ID          [ 1234567890            ]
  Access Token      [ •••••••••••••• (hidden, write-only) ]
  Test Event Code   [ TEST12345 (optional)   ]
  ( ) Enable Browser Tracking     (•) Enable Server Tracking
  [ Verify Connection ]  [ Send Test Event ]  [ Disconnect ]
  Status: ✓ Verified 2 minutes ago · Health 98% · Last error: none
```

**Diagnostics**
```
⚠ MEDIUM   Purchase events missing order value
  Reason: 3 of the last 50 Purchase events had value = 0.
  Fix: Ensure OrderPlacedEvent snapshot includes Pricing.Total.  [Fix]

✗ HIGH     Access token expired
  Reason: Last 14 CAPI calls returned 401 from graph.facebook.com.
  Fix: Reconnect Meta with a new token.                          [Fix]
```

**Event Timeline (per order)**
```
10:41:02  Visitor opened product "Blue Hoodie"
10:41:02  → ViewContent (browser)                       event_id=abc123
10:43:10  → AddToCart (browser)                         event_id=def456
10:44:55  → InitiateCheckout (browser)                   event_id=ghi789
10:46:20  → Purchase (browser)   Meta: 200 OK             event_id=jkl012
10:46:20  → Purchase (server)    Meta: 200 OK, deduped     event_id=jkl012
10:46:21  ✓ Deduplicated by Meta (fbtrace_id=Ab3x...)
```

## 4. Database Schema

All tables live in the `Ads` bounded context, Postgres snake_case, one store per row scope via `store_id`.

```
provider_integrations
  id                uuid PK
  store_id          uuid            -- tenant
  provider          int             -- AdProvider enum (Meta, TikTok, Snapchat, GA4, GoogleAds, GTM, ...)
  status             int             -- NotConfigured/Connected/Verified/Error/Disconnected
  credentials_json   jsonb           -- provider-specific fields; secrets encrypted via IDataProtector before storage
  browser_enabled    bool
  server_enabled     bool
  health_score       int             -- 0-100, rolling
  last_event_at      timestamptz null
  last_error_code    text null
  last_error_message text null
  last_verified_at   timestamptz null
  created_at / updated_at timestamptz
  UNIQUE (store_id, provider)

tracking_events
  id                uuid PK
  store_id          uuid
  event_id          uuid            -- shared browser+server dedup key (Meta "event_id")
  event_type        int             -- PageView/ViewContent/Search/AddToCart/InitiateCheckout/
                                     -- AddPaymentInfo/Purchase/CompleteRegistration/Contact
  channel           int             -- Browser / Server
  order_id          uuid null       -- OrderId when applicable
  customer_ref      text null       -- session/customer identifier for the timeline
  payload_json      jsonb           -- normalized event payload snapshot
  correlation_id    uuid            -- ties browser+server rows of the same logical event together
  created_at        timestamptz

tracking_dispatch_logs
  id                uuid PK
  tracking_event_id uuid FK -> tracking_events
  provider          int
  status            int             -- Pending/Processing/Succeeded/Failed/DeadLettered
  attempt_count     int
  last_attempt_at   timestamptz null
  next_retry_at     timestamptz null
  duration_ms       int null
  response_status   int null        -- HTTP status from provider
  response_body     text null       -- truncated raw response for diagnostics
  error_message     text null
  created_at / updated_at timestamptz

diagnostics_results
  id                uuid PK
  store_id          uuid
  provider          int null        -- null = platform-wide check
  check_code        text            -- e.g. "PixelReceivingEvents", "CapiTokenValid"
  severity          int             -- Info/Low/Medium/High
  passed            bool
  problem           text
  reason            text
  recommended_fix   text
  run_at            timestamptz

health_checks
  id                uuid PK
  store_id          uuid
  provider          int
  window_start      timestamptz
  window_end        timestamptz
  success_count     int
  failure_count     int
  avg_duration_ms    int
  uptime_percent     decimal(5,2)
```

`event_mappings` (page-type → event-type) and `retry_queue` are not separate tables: mapping is a static in-code `IEventTypeResolver`, and the retry queue is the `tracking_dispatch_logs` rows in `Pending`/`Failed` status picked up by `TrackingRetryWorker` — no separate durable queue table needed at this scale (see §16 for scale-out plan).

## 5. Architecture (Backend, Clean Architecture)

```
Qaflaty.Domain/Ads/
  Aggregates/ProviderIntegration/ProviderIntegration.cs (+Events/)
  Aggregates/TrackingEvent/TrackingEvent.cs (+Events/)
  ValueObjects/  (ProviderCredentials, DiagnosticFinding)
  Enums/         (AdProvider, TrackingEventType, TrackingChannel, DispatchStatus, IntegrationStatus, Severity)
  Errors/AdsErrors.cs
  Repositories/  (IProviderIntegrationRepository, ITrackingEventRepository)

Qaflaty.Application/Ads/
  Abstractions/  (ITrackingProvider, IEventDispatcher, IEventQueue, ITrackingLogger,
                  IProviderVerifier, IDiagnosticsService, ICredentialProtector)
  Commands/      (ConnectProvider, VerifyProvider, DisconnectProvider, SendTestEvent,
                  IngestBrowserEvent, ReplayEvent)
  Queries/       (GetDashboard, GetProviders, GetEvents, GetEventTimeline, GetDiagnostics,
                  GetLogs, GetMonitoring)
  EventHandlers/ (OrderPlacedTrackingHandler — server-side Purchase)
  DTOs/

Qaflaty.Infrastructure/Services/Ads/
  Providers/TrackingProviderBase.cs        -- Template Method: HTTP send + retry/backoff + logging
  Providers/MetaTrackingProvider.cs        -- full Pixel config + CAPI Graph API implementation
  Providers/TikTokTrackingProvider.cs      -- stub (Strategy, same interface)
  Providers/SnapchatTrackingProvider.cs    -- stub
  Providers/Ga4TrackingProvider.cs         -- stub
  Providers/GoogleAdsTrackingProvider.cs   -- stub
  Providers/GtmTrackingProvider.cs         -- stub
  TrackingProviderResolver.cs              -- Factory: AdProvider -> ITrackingProvider
  EventDispatcher.cs                       -- fan-out + dedup
  ChannelEventQueue.cs                     -- System.Threading.Channels backed IEventQueue
  TrackingRetryWorker.cs                   -- BackgroundService, exponential backoff, dead-letter
  DataProtectionCredentialProtector.cs     -- IDataProtector-based encrypt/decrypt
  DiagnosticsService.cs
  HealthMonitorService.cs

Qaflaty.Infrastructure/Persistence/
  Configurations/Ads/*.cs
  Repositories/ProviderIntegrationRepository.cs, TrackingEventRepository.cs

Qaflaty.Api/Controllers/
  MerchantAdsController.cs      -- api/stores/{storeId}/ads/**
  StorefrontTrackingController.cs -- api/storefront/tracking/events
```

### Design patterns used
- **Strategy** — one `ITrackingProvider` implementation per ad network; `EventDispatcher` treats them uniformly.
- **Adapter** — each provider adapts Qaflaty's normalized `TrackingEventPayload` to that network's wire format (Graph API JSON, TikTok Events API JSON, GA4 Measurement Protocol, …).
- **Template Method** — `TrackingProviderBase` centralizes HTTP send, timing, retry classification, and logging; subclasses only build the payload and endpoint.
- **Factory** — `TrackingProviderResolver` maps `AdProvider` → the correct DI-registered `ITrackingProvider`.
- **Repository + Unit of Work** — matches the rest of the codebase exactly (`IProviderIntegrationRepository`, `ITrackingEventRepository`, `IUnitOfWork`).
- **CQRS (MediatR)** — commands/queries/handlers, `Result`/`Error` pattern, `LoggingBehavior → ValidationBehavior → UnitOfWorkBehavior` pipeline — no changes needed to shared infrastructure.
- **Observer (domain events)** — `OrderPlacedEvent` → `OrderPlacedTrackingHandler` triggers the server-side Purchase without coupling Ordering to Ads.

### New abstractions (Application layer)

```csharp
public interface ITrackingProvider
{
    AdProvider Provider { get; }
    Task<Result> VerifyAsync(ProviderCredentials credentials, CancellationToken ct);
    Task<ProviderDispatchResult> SendAsync(TrackingEventPayload payload, ProviderCredentials credentials, CancellationToken ct);
}

public interface IEventDispatcher
{
    Task DispatchAsync(TrackingEventPayload payload, CancellationToken ct);
}

public interface IEventQueue
{
    ValueTask EnqueueAsync(QueuedDispatch dispatch, CancellationToken ct);
    IAsyncEnumerable<QueuedDispatch> ReadAllAsync(CancellationToken ct);
}

public interface ITrackingLogger
{
    Task LogDispatchAsync(TrackingEventId eventId, AdProvider provider, DispatchStatus status,
        int? httpStatus, string? responseBody, string? error, int durationMs, CancellationToken ct);
}

public interface IProviderVerifier
{
    // Verification sends a minimal event through the provider's REAL send path (e.g. Meta's
    // /events POST) rather than a read/introspection call. A Conversions API token can send
    // events but often lacks the ads_management permission needed to read the pixel node, so a
    // GET-based verify would falsely fail on tokens that actually work. Sending an event is the
    // only check that proves live tracking will succeed. A Test Event Code (when provided)
    // routes the verify event to the provider's test surface so it never pollutes real data.
    Task<Result> VerifyAsync(StoreId storeId, AdProvider provider, CancellationToken ct);
}

public interface IProviderConfiguration
{
    Task<ProviderCredentials?> GetCredentialsAsync(StoreId storeId, AdProvider provider, CancellationToken ct);
}

public interface IDiagnosticsService
{
    Task<IReadOnlyList<DiagnosticFinding>> RunAsync(StoreId storeId, CancellationToken ct);
}

public interface ICredentialProtector
{
    string Protect(string plaintext);
    string Unprotect(string protectedValue);
}
```

Adding **Pinterest**, **LinkedIn**, **X**, or **Microsoft Ads** later means: one new `AdProvider` enum value, one new `ITrackingProvider` implementation, one DI registration line. Nothing else in the pipeline changes.

## 6. Frontend Architecture (Angular)

Follows the existing merchant-app conventions exactly: standalone components, signals, Tailwind, lazy-loaded feature routes, a layout component with its own sub-nav (copied from `settings-layout`).

```
projects/merchant/src/app/features/ads/
  ads.routes.ts                 -- lazy ADS_ROUTES
  ads-layout/ads-layout.component.ts   -- sub-nav shell (Dashboard/Integrations/Diagnostics/
                                          Timeline/Test Center/Logs/Monitoring)
  dashboard/ads-dashboard.component.ts
  integrations/ads-integrations.component.ts
  diagnostics/ads-diagnostics.component.ts
  timeline/ads-event-timeline.component.ts
  test-center/ads-test-center.component.ts
  logs/ads-logs.component.ts
  monitoring/ads-monitoring.component.ts
  services/ads.service.ts        -- store-scoped HttpClient calls, mirrors promo-code.service.ts
```

Registered in `shell.component.ts` `navigationItems` as `{ name: 'Ads Management', icon: 'megaphone', route: '/ads' }`, and in `app.routes.ts` as a `loadChildren` entry under the authenticated Shell, gated by `storeGuard` and a `CanManageAds` policy check server-side.

Storefront (`projects/store`) gets a `TrackingService` that:
1. Fetches `GET /storefront/tracking/config` on app bootstrap (right after the main store config loads).
2. Injects each enabled provider's base script into `<head>` via `DOCUMENT` + `Renderer2` (no mechanism like this exists today — this is new).
3. Exposes `track(eventType, payload)` which fires the browser pixel call AND posts to `POST /storefront/tracking/events` (mirrored server event) using one shared `eventId` per logical action.

## 7. Folder Structure

See §5/§6 above — mirrors the existing `Catalog`/`Ordering` bounded-context layout exactly; no new top-level layers.

## 8. Class Diagram (core dispatch path)

```
TrackingEvent (aggregate)              ProviderIntegration (aggregate)
  - EventId, EventType, Channel          - StoreId, Provider, Credentials
  - PayloadJson, OrderId?, CorrelationId - BrowserEnabled, ServerEnabled
  - DispatchStatus per provider (via     - HealthScore, LastEventAt, LastError
    TrackingDispatchLog child rows)

EventDispatcher (IEventDispatcher)
  -> TrackingProviderResolver (Factory) -> ITrackingProvider (Strategy)
       MetaTrackingProvider : TrackingProviderBase (Template Method)
       TikTokTrackingProvider : TrackingProviderBase
       ...
  -> ITrackingLogger -> TrackingDispatchLog rows
  -> IEventQueue (enqueue) -> TrackingRetryWorker (BackgroundService, consumer)
```

## 9. API Contracts

```
GET    /api/stores/{storeId}/ads/dashboard
GET    /api/stores/{storeId}/ads/providers
POST   /api/stores/{storeId}/ads/providers/meta            { pixelId, accessToken, testEventCode, browserEnabled, serverEnabled }
POST   /api/stores/{storeId}/ads/providers/meta/verify
POST   /api/stores/{storeId}/ads/providers/{provider}/disconnect
POST   /api/stores/{storeId}/ads/test/purchase              { }
POST   /api/stores/{storeId}/ads/test/checkout
POST   /api/stores/{storeId}/ads/test/view-content
GET    /api/stores/{storeId}/ads/events?type=&provider=&status=&from=&to=&page=
GET    /api/stores/{storeId}/ads/events/{orderId}/timeline
GET    /api/stores/{storeId}/ads/logs?...
GET    /api/stores/{storeId}/ads/diagnostics
GET    /api/stores/{storeId}/ads/monitoring
POST   /api/stores/{storeId}/ads/replay/{trackingEventId}

GET    /api/storefront/tracking/config    -- public, non-secret pixel config (e.g. Meta Pixel ID) per enabled provider
POST   /api/storefront/tracking/events    { eventKey, eventType, payload }   -- browser -> server mirror, tenant resolved via X-Store-Slug
```

All merchant routes are covered for free by the existing global `StoreScopeAuthorizationFilter` (route `{storeId}` vs JWT `merchant_id`) — no bespoke tenant-isolation code needed. A new `CanManageAds` authorization policy gates write actions.

## 10. Event Lifecycle

```
1. Page/action occurs in the storefront SPA
2. TrackingService resolves eventType from route/action + generates one eventId (Guid)
3. Browser channel: provider's client script (fbq/ttq/gtag) fires immediately, tagged with eventId
4. Server channel (parallel, non-blocking): POST /storefront/tracking/events{eventType, eventId, payload}
     -> StorefrontTrackingController -> IngestBrowserEventCommand
     -> EventDispatcher.DispatchAsync -> resolves enabled providers for the store
     -> for each provider: ITrackingProvider.SendAsync (sync attempt) or IEventQueue.EnqueueAsync (async retry path)
     -> ITrackingLogger records a TrackingDispatchLog row (Pending -> Succeeded/Failed)
5. For Purchase specifically, a domain event handler (`OrderPlacedTrackingHandler`, subscribed
   to `OrderPlacedEvent`) ALSO dispatches a server-side event using the OrderId itself as the
   deterministic event key, so even if the browser event was lost (ad blocker, closed tab) the
   server event still lands. `CompleteRegistration` is currently browser-channel only —
   `StoreCustomerRegisteredEvent` doesn't carry a `StoreId` (customer accounts are shared
   across stores in the Identity context), so there is no clean server-side hook yet; see §18.
6. Provider (e.g. Meta) deduplicates browser+server events sharing event_id; the Event
   Timeline displays both rows plus a synthesized "Deduplicated" marker once both succeed.
```

## 11. Background Processing Architecture

`TrackingRetryWorker : BackgroundService` (same shape as `GuestCartCleanupService`): a scoped loop that polls `tracking_dispatch_logs` where `status IN (Pending, Failed) AND next_retry_at <= now`, dispatches through `IEventDispatcher`, and updates status:

```
Pending -> Processing -> Succeeded
                       -> Failed (attempt_count++, next_retry_at = now + backoff(attempt_count))
                            backoff: 30s, 2m, 10m, 1h, 6h -> DeadLettered after 5 attempts
```

Dead-lettered events remain visible in Logs with a **Replay** action (`POST /ads/replay/{id}`) that resets status to `Pending` and re-enqueues.

At current scale, an in-process `System.Threading.Channels`-backed `IEventQueue` plus the DB-backed retry sweep is sufficient (matches the codebase's existing "no external broker" posture). See §16 for the swap-in path to a durable broker.

## 12. Edge Cases

- **Ad blockers / browser privacy modes** block the client Pixel script entirely — the server-side mirror (via domain event handlers for Purchase/CompleteRegistration, and the `/tracking/events` POST for the rest) is the safety net; Purchase in particular is guaranteed by the `OrderPlacedEvent` hook regardless of what the browser did.
- **OTP checkout path** — `OrderPlacedEvent` fires identically whether the order was auto-confirmed or confirmed after OTP verification, so Purchase never double-fires and never fires early.
- **Guest vs authenticated cart** — AddToCart tracking reads `CartService.addItem` at the single chokepoint used by both guest and authenticated carts.
- **Refunds/cancellations** — out of scope for v1 standard events (Meta/TikTok have no first-class "Refund" standard event universally supported); tracked as a future enhancement (§17).
- **Multiple browser tabs / duplicate submits** — `eventId` for Purchase is derived deterministically from `OrderId` server-side, so retries or duplicate deliveries of the same order never produce two distinct Purchase events at the provider.
- **Token expiry mid-flight** — `DiagnosticsService` flags `401`/`190` (Meta invalid-token subcode) responses within the last N calls as a High severity "Access token expired" finding with a Reconnect fix action.
- **Test Event Code left set in production** — Diagnostics flags a non-empty `testEventCode` combined with `>0` Purchase events in the last 24h as a Medium finding (events may not be counting toward real campaigns).

## 13. Standard Page → Event Mapping

| Storefront location | Standard event |
|---|---|
| Home | PageView |
| Product detail | ViewContent |
| Search / product list with query | Search |
| `CartService.addItem()` | AddToCart |
| Checkout page load | InitiateCheckout |
| Payment method selected at checkout | AddPaymentInfo |
| Order confirmation page (+ `OrderPlacedEvent` server-side) | Purchase |
| Customer registration success (+ `StoreCustomerRegisteredEvent` server-side) | CompleteRegistration |
| Contact form submit | Contact |
| Every route change | PageView |

## 14. Best Practices Followed

- Shared `event_id` between browser and server calls (Meta/TikTok deduplication contract).
- Secrets never returned to the frontend — `ProviderIntegrationDto` exposes only a masked token (`•••• 4a2f`) and connection status; `ProtectAsync`/`UnprotectAsync` live entirely server-side via `ICredentialProtector` (ASP.NET Data Protection).
- All merchant writes go through FluentValidation + the `CanManageAds` policy + the global store-scope filter — defense in depth matches the rest of the codebase.
- Tracking never blocks page rendering: browser pixel calls are fire-and-forget; the server mirror call is non-blocking (`fetch`/`HttpClient` without awaiting the UI).
- Domain events keep Ads decoupled from Ordering/Identity — no direct dependency, only `INotificationHandler<T>` subscriptions, matching `OrderPlacedEventHandler`'s existing pattern.

## 15. Suggested Improvements Beyond Easy Orders

- **Health score** is computed, not just a boolean connected/disconnected — factors in recent failure rate, token validity, and event recency, giving merchants an early warning before conversions silently stop.
- **Event Timeline** ties browser + server + dedup + provider response into one causal chain per order, not just a flat event log.
- **Diagnostics with one-click fixes** rather than static help articles.
- **Dead-letter + Replay** — no ad conversions are silently dropped; anything unrecoverable is inspectable and replayable.
- **Provider-agnostic core** — new networks are a Strategy implementation, not a schema migration.

## 16. Scalability Plan

Current design (in-process channel queue + DB retry sweep) comfortably handles a single-instance deployment at moderate volume. To scale to "millions of events/day" across multiple API instances:
1. Swap `ChannelEventQueue` for a durable broker (Postgres `SKIP LOCKED` polling table already fits, or RabbitMQ/Azure Service Bus) behind the same `IEventQueue` interface — no call-site changes.
2. Partition `TrackingRetryWorker` polling by `store_id` hash range if a single worker becomes a bottleneck, or move to multiple worker instances with `FOR UPDATE SKIP LOCKED` claims.
3. Move `tracking_dispatch_logs`/`tracking_events` to a time-partitioned table (Postgres native partitioning by month) once volume warrants it; Logs/Timeline queries already filter by date range.
4. `HealthMonitorService` aggregates into `health_checks` on a rollup cadence (hourly) rather than scanning raw logs per dashboard load.

## 17. Testing Strategy

- **Unit** — `tests/Qaflaty.UnitTests/Ads/`: aggregate invariants (`ProviderIntegration`, `TrackingEvent`), `EventDispatcher` dedup/fan-out logic, `MetaTrackingProvider` payload mapping against a mocked `HttpMessageHandler`, retry/backoff calculation, `DiagnosticsService` rule evaluation.
- **Integration** (future pass) — in-memory/test Postgres round-trip of `ProviderIntegrationRepository`/`TrackingEventRepository`, controller-level tests against `StoreScopeAuthorizationFilter`.
- **Provider mocking** — `ITrackingProvider` is trivially mockable per test; `MetaTrackingProvider` is tested against a fake `HttpClient` handler returning canned Graph API responses (success, 401, 500, timeout).
- **Load testing** (future pass) — k6/NBomber script hammering `/storefront/tracking/events` to validate the queue+retry path doesn't block request threads under burst load.

## 18. Future Scalability / Roadmap Notes

- Add a server-side `CompleteRegistration` hook once `StoreCustomerRegisteredEvent` (or the registration command) carries the originating `StoreId` — today customer accounts are modeled as shared across stores in the Identity context, so there's no store to resolve providers for at that event.
- Fill in TikTok Events API, Snapchat CAPI, GA4 Measurement Protocol, Google Ads Enhanced Conversions, and GTM server container support behind the existing `ITrackingProvider` stubs.
- Add Pinterest, LinkedIn, X, Microsoft Ads as pure additive `ITrackingProvider` implementations.
- Add a durable outbox pattern if multi-instance deployment is introduced before a broker is adopted.
- Consider an audit log entity for provider configuration changes (who changed what token, when) once RBAC on this surface needs finer granularity than `CanManageAds`.
