using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Qaflaty.Application.Ads.Abstractions;
using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Infrastructure.Services.Ads.Providers;

/// <summary>
/// Snapchat Pixel (browser, handled by the storefront) + Conversions API v3 (server) adapter.
/// Snapchat's v3 CAPI is Meta-aligned, so the payload shape is very close to
/// <see cref="MetaTrackingProvider"/>. The two differences that need their own handling:
/// 1. Standard event names use UPPER_SNAKE_CASE (PAGE_VIEW, ADD_CART, ...), not Meta's names.
/// 2. The token is a URL query parameter and the endpoint is per-pixel (/v3/{pixelId}/events).
/// </summary>
public sealed class SnapchatTrackingProvider : TrackingProviderBase, ITrackingProvider
{
    private const string BaseUrl = "https://tr.snapchat.com/v3/";

    // Our normalized event types -> Snapchat's standard event names (upper-snake).
    private static readonly IReadOnlyDictionary<TrackingEventType, string> EventNameMap = new Dictionary<TrackingEventType, string>
    {
        [TrackingEventType.PageView] = "PAGE_VIEW",
        [TrackingEventType.ViewContent] = "VIEW_CONTENT",
        [TrackingEventType.Search] = "SEARCH",
        [TrackingEventType.AddToCart] = "ADD_CART",
        [TrackingEventType.InitiateCheckout] = "START_CHECKOUT",
        [TrackingEventType.AddPaymentInfo] = "ADD_BILLING",
        [TrackingEventType.Purchase] = "PURCHASE",
        [TrackingEventType.CompleteRegistration] = "SIGN_UP",
        [TrackingEventType.Contact] = "CONTACT"
    };

    private readonly HttpClient _httpClient;

    public SnapchatTrackingProvider(HttpClient httpClient, ILogger<SnapchatTrackingProvider> logger) : base(logger)
    {
        _httpClient = httpClient;
    }

    public override AdProvider Provider => AdProvider.Snapchat;

    public async Task<Result> VerifyAsync(ProviderCredentialSet credentials, CancellationToken ct)
    {
        var pixelId = credentials.Get("pixelId");
        var accessToken = credentials.Get("accessToken");

        if (string.IsNullOrWhiteSpace(pixelId) || string.IsNullOrWhiteSpace(accessToken))
            return Result.Failure(new Error("Ads.Snapchat.MissingCredentials", "Pixel ID and Access Token are required"));

        // Verify by sending a minimal event through the real /events path (the same permission the
        // live dispatch uses). A user agent is always included so it isn't rejected for missing
        // customer information.
        var payload = new TrackingEventPayload(
            Qaflaty.Domain.Common.Identifiers.StoreId.From(Guid.Empty),
            Guid.NewGuid(),
            TrackingEventType.PageView,
            TrackingChannel.Server,
            DateTime.UtcNow,
            OrderId: null,
            CustomerRef: $"snapchat-verify-{pixelId}",
            Value: null,
            Currency: null,
            Contents: null,
            PageUrl: null,
            ClientIpAddress: null,
            ClientUserAgent: "Qaflaty-Verify/1.0",
            CustomerEmail: null,
            CustomerPhone: null);

        var result = await SendAsync(payload, credentials, ct);
        return result.Succeeded
            ? Result.Success()
            : Result.Failure(new Error("Ads.Snapchat.VerificationFailed", result.ErrorMessage ?? "Snapchat rejected the test event"));
    }

    public Task<ProviderDispatchResult> SendAsync(TrackingEventPayload payload, ProviderCredentialSet credentials, CancellationToken ct)
    {
        var pixelId = credentials.Get("pixelId");
        var accessToken = credentials.Get("accessToken");

        var body = new SnapEventsRequest
        {
            Data =
            [
                new SnapEvent
                {
                    EventName = EventNameMap.GetValueOrDefault(payload.EventType, payload.EventType.ToString()),
                    EventTime = new DateTimeOffset(payload.OccurredAt).ToUnixTimeMilliseconds(),
                    EventId = payload.EventKey.ToString(),
                    EventSourceUrl = payload.PageUrl,
                    UserData = new SnapUserData
                    {
                        EmailHash = HashOrNull(payload.CustomerEmail),
                        PhoneHash = HashOrNull(payload.CustomerPhone),
                        ClientIpAddress = payload.ClientIpAddress,
                        ClientUserAgent = payload.ClientUserAgent
                    },
                    CustomData = BuildCustomData(payload)
                }
            ]
        };

        return ExecuteAsync(
            () => _httpClient.PostAsJsonAsync(
                $"{BaseUrl}{pixelId}/events?access_token={Uri.EscapeDataString(accessToken ?? string.Empty)}", body, JsonOptions, ct),
            ExtractError);
    }

    private static SnapCustomData? BuildCustomData(TrackingEventPayload payload)
    {
        var hasContents = payload.Contents is { Count: > 0 };
        if (payload.Value is null && string.IsNullOrEmpty(payload.Currency) && !hasContents)
            return null;

        return new SnapCustomData
        {
            Currency = payload.Currency,
            // Snapchat expects the purchase value as a string.
            Value = payload.Value?.ToString(System.Globalization.CultureInfo.InvariantCulture),
            ContentIds = payload.Contents?.Select(c => c.ContentId).ToList(),
            NumItems = payload.Contents?.Sum(c => c.Quantity)
        };
    }

    private static string? HashOrNull(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value.Trim().ToLowerInvariant()));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static string? ExtractError(string body)
    {
        if (string.IsNullOrWhiteSpace(body))
            return null;
        try
        {
            var parsed = JsonSerializer.Deserialize<SnapResponse>(body, JsonOptions);
            // Snapchat surfaces failures in a few shapes; prefer the most specific message available.
            return parsed?.Error?.Message ?? parsed?.Reason ?? parsed?.Status;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        PropertyNameCaseInsensitive = true
    };

    private sealed class SnapEventsRequest
    {
        [JsonPropertyName("data")] public List<SnapEvent> Data { get; set; } = [];
    }

    private sealed class SnapEvent
    {
        [JsonPropertyName("event_name")] public string EventName { get; set; } = string.Empty;
        [JsonPropertyName("event_time")] public long EventTime { get; set; }
        [JsonPropertyName("event_id")] public string EventId { get; set; } = string.Empty;
        [JsonPropertyName("action_source")] public string ActionSource { get; set; } = "WEB";
        [JsonPropertyName("event_source_url")] public string? EventSourceUrl { get; set; }
        [JsonPropertyName("user_data")] public SnapUserData UserData { get; set; } = new();
        [JsonPropertyName("custom_data")] public SnapCustomData? CustomData { get; set; }
    }

    private sealed class SnapUserData
    {
        [JsonPropertyName("em")] public List<string>? Em => EmailHash is null ? null : [EmailHash];
        [JsonPropertyName("ph")] public List<string>? Ph => PhoneHash is null ? null : [PhoneHash];
        [JsonIgnore] public string? EmailHash { get; set; }
        [JsonIgnore] public string? PhoneHash { get; set; }
        [JsonPropertyName("client_ip_address")] public string? ClientIpAddress { get; set; }
        [JsonPropertyName("client_user_agent")] public string? ClientUserAgent { get; set; }
    }

    private sealed class SnapCustomData
    {
        [JsonPropertyName("currency")] public string? Currency { get; set; }
        [JsonPropertyName("value")] public string? Value { get; set; }
        [JsonPropertyName("content_ids")] public List<string>? ContentIds { get; set; }
        [JsonPropertyName("num_items")] public int? NumItems { get; set; }
    }

    private sealed class SnapResponse
    {
        [JsonPropertyName("status")] public string? Status { get; set; }
        [JsonPropertyName("reason")] public string? Reason { get; set; }
        [JsonPropertyName("error")] public SnapError? Error { get; set; }
    }

    private sealed class SnapError
    {
        [JsonPropertyName("message")] public string? Message { get; set; }
    }
}
