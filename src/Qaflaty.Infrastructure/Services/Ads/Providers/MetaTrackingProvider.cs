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

        if (string.IsNullOrWhiteSpace(pixelId) || string.IsNullOrWhiteSpace(accessToken))
            return Result.Failure(new Error("Ads.Meta.MissingCredentials", "Pixel ID and Access Token are required"));

        try
        {
            using var response = await _httpClient.GetAsync(
                $"{pixelId}?fields=id,name&access_token={Uri.EscapeDataString(accessToken)}", ct);

            if (response.IsSuccessStatusCode)
                return Result.Success();

            var body = await response.Content.ReadAsStringAsync(ct);
            var message = ExtractGraphErrorMessage(body) ?? $"Meta returned HTTP {(int)response.StatusCode}";
            return Result.Failure(new Error("Ads.Meta.VerificationFailed", message));
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
                    CustomData = new GraphCustomData
                    {
                        Currency = payload.Currency,
                        Value = payload.Value,
                        ContentIds = payload.Contents?.Select(c => c.ContentId).ToList(),
                        Contents = payload.Contents?.Select(c => new GraphContent { Id = c.ContentId, Quantity = c.Quantity }).ToList()
                    }
                }
            ],
            TestEventCode = string.IsNullOrWhiteSpace(testEventCode) ? null : testEventCode
        };

        return ExecuteAsync(
            () => _httpClient.PostAsJsonAsync($"{pixelId}/events?access_token={Uri.EscapeDataString(accessToken ?? string.Empty)}", body, JsonOptions, ct),
            responseBody => ExtractGraphErrorMessage(responseBody));
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
        [JsonPropertyName("custom_data")] public GraphCustomData CustomData { get; set; } = new();
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
