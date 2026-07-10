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
/// Meta Pixel (browser config only — no server call) + Conversions API (CAPI) adapter.
/// Browser tracking is handled entirely by the storefront SPA loading fbevents.js with the
/// Pixel ID; this class only ever talks to the server-side Graph API.
/// </summary>
public sealed class MetaTrackingProvider : TrackingProviderBase, ITrackingProvider
{
    private const string GraphApiVersion = "v19.0";
    private readonly HttpClient _httpClient;

    public MetaTrackingProvider(HttpClient httpClient, ILogger<MetaTrackingProvider> logger) : base(logger)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress ??= new Uri($"https://graph.facebook.com/{GraphApiVersion}/");
    }

    public override AdProvider Provider => AdProvider.Meta;

    public async Task<Result> VerifyAsync(ProviderCredentialSet credentials, CancellationToken ct)
    {
        var pixelId = credentials.Get("pixelId");
        var accessToken = credentials.Get("accessToken");
        var testEventCode = credentials.Get("testEventCode");

        if (string.IsNullOrWhiteSpace(pixelId) || string.IsNullOrWhiteSpace(accessToken))
            return Result.Failure(new Error("Ads.Meta.MissingCredentials", "Pixel ID and Access Token are required"));

        // Verify by POSTing a minimal event to the SAME /events endpoint the live dispatch uses,
        // NOT by GETting the pixel node. A Conversions API access token has the "send events"
        // permission but usually lacks ads_management/read access on the pixel object, so a GET
        // verify falsely fails with "(#100) Missing Permission" on tokens that can actually send
        // events. Sending a test event is the only check that proves live tracking will work.
        // When a Test Event Code is provided, Meta routes the event to Events Manager > Test
        // Events so verification never pollutes real reporting data.
        var body = new GraphEventsRequest
        {
            Data =
            [
                new GraphEvent
                {
                    EventName = "PageView",
                    EventTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                    EventId = $"qaflaty-verify-{Guid.NewGuid()}",
                    ActionSource = "website",
                    UserData = new GraphUserData { ClientUserAgent = "Qaflaty-Verify/1.0" }
                }
            ],
            TestEventCode = string.IsNullOrWhiteSpace(testEventCode) ? null : testEventCode
        };

        try
        {
            using var response = await _httpClient.PostAsJsonAsync(
                $"{pixelId}/events?access_token={Uri.EscapeDataString(accessToken)}", body, JsonOptions, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                var message = ExtractGraphErrorMessage(responseBody) ?? $"Meta returned HTTP {(int)response.StatusCode}";
                return Result.Failure(new Error("Ads.Meta.VerificationFailed", message));
            }

            var parsed = JsonSerializer.Deserialize<GraphEventsResponse>(responseBody, JsonOptions);
            if (parsed?.EventsReceived is > 0)
                return Result.Success();

            return Result.Failure(new Error("Ads.Meta.VerificationFailed",
                "Meta accepted the request but reported no events received. Double-check the Pixel ID."));
        }
        catch (Exception ex)
        {
            return Result.Failure(new Error("Ads.Meta.VerificationFailed", ex.Message));
        }
    }

    public Task<ProviderDispatchResult> SendAsync(TrackingEventPayload payload, ProviderCredentialSet credentials, CancellationToken ct)
    {
        var pixelId = credentials.Get("pixelId");
        var accessToken = credentials.Get("accessToken");
        var testEventCode = credentials.Get("testEventCode");

        var body = new GraphEventsRequest
        {
            Data =
            [
                new GraphEvent
                {
                    EventName = payload.EventType.ToString(),
                    EventTime = new DateTimeOffset(payload.OccurredAt).ToUnixTimeSeconds(),
                    EventId = payload.EventKey.ToString(),
                    ActionSource = "website",
                    EventSourceUrl = payload.PageUrl,
                    UserData = new GraphUserData
                    {
                        EmailHash = HashOrNull(payload.CustomerEmail),
                        PhoneHash = HashOrNull(payload.CustomerPhone),
                        ClientIpAddress = payload.ClientIpAddress,
                        ClientUserAgent = payload.ClientUserAgent
                    },
                    CustomData = BuildCustomData(payload)
                }
            ],
            TestEventCode = string.IsNullOrWhiteSpace(testEventCode) ? null : testEventCode
        };

        return ExecuteAsync(
            () => _httpClient.PostAsJsonAsync($"{pixelId}/events?access_token={Uri.EscapeDataString(accessToken ?? string.Empty)}", body, JsonOptions, ct),
            responseBody => ExtractGraphErrorMessage(responseBody));
    }

    /// <summary>
    /// Builds custom_data only when the event actually carries commerce data. Events like
    /// PageView/Search have none, so we return null and let WhenWritingNull omit the field
    /// entirely rather than sending an empty "custom_data": {} object.
    /// </summary>
    private static GraphCustomData? BuildCustomData(TrackingEventPayload payload)
    {
        var hasContents = payload.Contents is { Count: > 0 };
        if (payload.Value is null && string.IsNullOrEmpty(payload.Currency) && !hasContents)
            return null;

        return new GraphCustomData
        {
            Currency = payload.Currency,
            Value = payload.Value,
            ContentIds = payload.Contents?.Select(c => c.ContentId).ToList(),
            Contents = payload.Contents?.Select(c => new GraphContent { Id = c.ContentId, Quantity = c.Quantity }).ToList()
        };
    }

    private static string? HashOrNull(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value.Trim().ToLowerInvariant()));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static string? ExtractGraphErrorMessage(string? body)
    {
        if (string.IsNullOrWhiteSpace(body))
            return null;

        try
        {
            var parsed = JsonSerializer.Deserialize<GraphErrorEnvelope>(body, JsonOptions);
            return parsed?.Error?.Message;
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

    private sealed class GraphEventsRequest
    {
        [JsonPropertyName("data")] public List<GraphEvent> Data { get; set; } = [];
        [JsonPropertyName("test_event_code")] public string? TestEventCode { get; set; }
    }

    private sealed class GraphEvent
    {
        [JsonPropertyName("event_name")] public string EventName { get; set; } = string.Empty;
        [JsonPropertyName("event_time")] public long EventTime { get; set; }
        [JsonPropertyName("event_id")] public string EventId { get; set; } = string.Empty;
        [JsonPropertyName("action_source")] public string ActionSource { get; set; } = "website";
        [JsonPropertyName("event_source_url")] public string? EventSourceUrl { get; set; }
        [JsonPropertyName("user_data")] public GraphUserData UserData { get; set; } = new();
        [JsonPropertyName("custom_data")] public GraphCustomData? CustomData { get; set; }
    }

    private sealed class GraphUserData
    {
        [JsonPropertyName("em")] public List<string>? Em => EmailHash is null ? null : [EmailHash];
        [JsonPropertyName("ph")] public List<string>? Ph => PhoneHash is null ? null : [PhoneHash];
        [JsonIgnore] public string? EmailHash { get; set; }
        [JsonIgnore] public string? PhoneHash { get; set; }
        [JsonPropertyName("client_ip_address")] public string? ClientIpAddress { get; set; }
        [JsonPropertyName("client_user_agent")] public string? ClientUserAgent { get; set; }
    }

    private sealed class GraphCustomData
    {
        [JsonPropertyName("currency")] public string? Currency { get; set; }
        [JsonPropertyName("value")] public decimal? Value { get; set; }
        [JsonPropertyName("content_ids")] public List<string>? ContentIds { get; set; }
        [JsonPropertyName("contents")] public List<GraphContent>? Contents { get; set; }
    }

    private sealed class GraphContent
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("quantity")] public int Quantity { get; set; }
    }

    private sealed class GraphEventsResponse
    {
        [JsonPropertyName("events_received")] public int? EventsReceived { get; set; }
        [JsonPropertyName("messages")] public List<string>? Messages { get; set; }
        [JsonPropertyName("fbtrace_id")] public string? FbTraceId { get; set; }
    }

    private sealed class GraphErrorEnvelope
    {
        [JsonPropertyName("error")] public GraphError? Error { get; set; }
    }

    private sealed class GraphError
    {
        [JsonPropertyName("message")] public string? Message { get; set; }
        [JsonPropertyName("code")] public int? Code { get; set; }
    }
}
