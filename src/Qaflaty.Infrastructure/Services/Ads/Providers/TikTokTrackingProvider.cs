using System.Net.Http.Headers;
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
/// TikTok Pixel (browser, handled by the storefront) + Events API 2.0 (server) adapter.
/// This class only talks to the server-side Events API.
///
/// Two things differ from Meta and are the reason this needs its own adapter:
/// 1. The access token goes in an <c>Access-Token</c> HTTP header, not a URL query parameter.
/// 2. TikTok returns HTTP 200 even for logical errors and signals failure with <c>code != 0</c>
///    in the body, so success is determined from the body, not the HTTP status (see the
///    <c>isSuccess</c> predicate passed to <see cref="ExecuteAsync"/>).
/// </summary>
public sealed class TikTokTrackingProvider : TrackingProviderBase, ITrackingProvider
{
    private const string EventsEndpoint = "https://business-api.tiktok.com/open_api/v1.3/event/track/";

    // Our normalized event types -> TikTok's standard event names. Most match; the ones that
    // differ are Purchase (CompletePayment) and PageView (Pageview).
    private static readonly IReadOnlyDictionary<TrackingEventType, string> EventNameMap = new Dictionary<TrackingEventType, string>
    {
        [TrackingEventType.PageView] = "Pageview",
        [TrackingEventType.ViewContent] = "ViewContent",
        [TrackingEventType.Search] = "Search",
        [TrackingEventType.AddToCart] = "AddToCart",
        [TrackingEventType.InitiateCheckout] = "InitiateCheckout",
        [TrackingEventType.AddPaymentInfo] = "AddPaymentInfo",
        [TrackingEventType.Purchase] = "CompletePayment",
        [TrackingEventType.CompleteRegistration] = "CompleteRegistration",
        [TrackingEventType.Contact] = "Contact"
    };

    private readonly HttpClient _httpClient;

    public TikTokTrackingProvider(HttpClient httpClient, ILogger<TikTokTrackingProvider> logger) : base(logger)
    {
        _httpClient = httpClient;
    }

    public override AdProvider Provider => AdProvider.TikTok;

    public async Task<Result> VerifyAsync(ProviderCredentialSet credentials, CancellationToken ct)
    {
        var pixelCode = credentials.Get("pixelId");
        var accessToken = credentials.Get("accessToken");

        if (string.IsNullOrWhiteSpace(pixelCode) || string.IsNullOrWhiteSpace(accessToken))
            return Result.Failure(new Error("Ads.TikTok.MissingCredentials", "Pixel Code and Access Token are required"));

        // Verify by sending a minimal event through the real /event/track/ path — the same
        // permission the live dispatch uses. A verify event always carries a hashed external_id
        // (a strong matching parameter) so it isn't rejected for insufficient user data.
        var payload = new TrackingEventPayload(
            Qaflaty.Domain.Common.Identifiers.StoreId.From(Guid.Empty),
            Guid.NewGuid(),
            TrackingEventType.PageView,
            TrackingChannel.Server,
            DateTime.UtcNow,
            OrderId: null,
            CustomerRef: $"tiktok-verify-{pixelCode}",
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
            : Result.Failure(new Error("Ads.TikTok.VerificationFailed", result.ErrorMessage ?? "TikTok rejected the test event"));
    }

    public Task<ProviderDispatchResult> SendAsync(TrackingEventPayload payload, ProviderCredentialSet credentials, CancellationToken ct)
    {
        var pixelCode = credentials.Get("pixelId");
        var accessToken = credentials.Get("accessToken");
        var testEventCode = credentials.Get("testEventCode");

        var body = new TikTokEventsRequest
        {
            EventSourceId = pixelCode ?? string.Empty,
            TestEventCode = string.IsNullOrWhiteSpace(testEventCode) ? null : testEventCode,
            Data =
            [
                new TikTokEvent
                {
                    Event = EventNameMap.GetValueOrDefault(payload.EventType, payload.EventType.ToString()),
                    EventTime = new DateTimeOffset(payload.OccurredAt).ToUnixTimeSeconds(),
                    EventId = payload.EventKey.ToString(),
                    User = new TikTokUser
                    {
                        Email = HashOrNull(payload.CustomerEmail),
                        Phone = HashOrNull(payload.CustomerPhone),
                        ExternalId = HashOrNull(payload.CustomerRef),
                        Ip = payload.ClientIpAddress,
                        UserAgent = payload.ClientUserAgent
                    },
                    Page = string.IsNullOrEmpty(payload.PageUrl) ? null : new TikTokPage { Url = payload.PageUrl },
                    Properties = BuildProperties(payload)
                }
            ]
        };

        return ExecuteAsync(
            () =>
            {
                var request = new HttpRequestMessage(HttpMethod.Post, EventsEndpoint)
                {
                    Content = JsonContent.Create(body, options: JsonOptions)
                };
                request.Headers.TryAddWithoutValidation("Access-Token", accessToken ?? string.Empty);
                return _httpClient.SendAsync(request, ct);
            },
            ExtractError,
            isSuccess: IsCodeZero);
    }

    private static TikTokProperties? BuildProperties(TrackingEventPayload payload)
    {
        var hasContents = payload.Contents is { Count: > 0 };
        if (payload.Value is null && string.IsNullOrEmpty(payload.Currency) && !hasContents)
            return null;

        return new TikTokProperties
        {
            Currency = payload.Currency,
            Value = payload.Value,
            Contents = payload.Contents?.Select(c => new TikTokContent
            {
                ContentId = c.ContentId,
                Quantity = c.Quantity,
                Price = c.Price
            }).ToList()
        };
    }

    private static string? HashOrNull(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value.Trim().ToLowerInvariant()));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    // TikTok signals logical success with code == 0 in an HTTP-200 body.
    private static bool IsCodeZero(string body)
    {
        if (string.IsNullOrWhiteSpace(body))
            return false;
        try
        {
            var parsed = JsonSerializer.Deserialize<TikTokResponse>(body, JsonOptions);
            return parsed?.Code == 0;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static string? ExtractError(string body)
    {
        if (string.IsNullOrWhiteSpace(body))
            return null;
        try
        {
            var parsed = JsonSerializer.Deserialize<TikTokResponse>(body, JsonOptions);
            if (parsed != null && parsed.Code != 0)
                return string.IsNullOrWhiteSpace(parsed.Message) ? $"TikTok returned code {parsed.Code}" : parsed.Message;
            return null;
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

    private sealed class TikTokEventsRequest
    {
        [JsonPropertyName("event_source")] public string EventSource { get; set; } = "web";
        [JsonPropertyName("event_source_id")] public string EventSourceId { get; set; } = string.Empty;
        [JsonPropertyName("test_event_code")] public string? TestEventCode { get; set; }
        [JsonPropertyName("data")] public List<TikTokEvent> Data { get; set; } = [];
    }

    private sealed class TikTokEvent
    {
        [JsonPropertyName("event")] public string Event { get; set; } = string.Empty;
        [JsonPropertyName("event_time")] public long EventTime { get; set; }
        [JsonPropertyName("event_id")] public string EventId { get; set; } = string.Empty;
        [JsonPropertyName("user")] public TikTokUser User { get; set; } = new();
        [JsonPropertyName("page")] public TikTokPage? Page { get; set; }
        [JsonPropertyName("properties")] public TikTokProperties? Properties { get; set; }
    }

    private sealed class TikTokUser
    {
        [JsonPropertyName("email")] public string? Email { get; set; }
        [JsonPropertyName("phone")] public string? Phone { get; set; }
        [JsonPropertyName("external_id")] public string? ExternalId { get; set; }
        [JsonPropertyName("ip")] public string? Ip { get; set; }
        [JsonPropertyName("user_agent")] public string? UserAgent { get; set; }
    }

    private sealed class TikTokPage
    {
        [JsonPropertyName("url")] public string Url { get; set; } = string.Empty;
    }

    private sealed class TikTokProperties
    {
        [JsonPropertyName("currency")] public string? Currency { get; set; }
        [JsonPropertyName("value")] public decimal? Value { get; set; }
        [JsonPropertyName("contents")] public List<TikTokContent>? Contents { get; set; }
    }

    private sealed class TikTokContent
    {
        [JsonPropertyName("content_id")] public string ContentId { get; set; } = string.Empty;
        [JsonPropertyName("quantity")] public int Quantity { get; set; }
        [JsonPropertyName("price")] public decimal? Price { get; set; }
    }

    private sealed class TikTokResponse
    {
        [JsonPropertyName("code")] public int Code { get; set; }
        [JsonPropertyName("message")] public string? Message { get; set; }
        [JsonPropertyName("request_id")] public string? RequestId { get; set; }
    }
}
