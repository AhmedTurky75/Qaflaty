using System.Net;
using Microsoft.Extensions.Logging.Abstractions;
using Qaflaty.Application.Ads.Abstractions;
using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Infrastructure.Services.Ads.Providers;
using Xunit;

namespace Qaflaty.UnitTests.Infrastructure.Ads;

public class MetaTrackingProviderTests
{
    private static ProviderCredentialSet Credentials(string? testEventCode = null)
    {
        var values = new Dictionary<string, string>
        {
            ["pixelId"] = "1234567890",
            ["accessToken"] = "test-token"
        };
        if (testEventCode != null)
            values["testEventCode"] = testEventCode;

        return new ProviderCredentialSet(values);
    }

    private static TrackingEventPayload PurchasePayload(Guid eventKey) => new(
        Qaflaty.Domain.Common.Identifiers.StoreId.New(),
        eventKey,
        TrackingEventType.Purchase,
        TrackingChannel.Server,
        DateTime.UtcNow,
        OrderId: null,
        CustomerRef: "cust-1",
        Value: 99.99m,
        Currency: "SAR",
        Contents: [new TrackingContentItem("prod-1", 1, 99.99m)],
        PageUrl: "https://store.example.com/order-confirmation",
        ClientIpAddress: "1.2.3.4",
        ClientUserAgent: "test-agent",
        CustomerEmail: "shopper@example.com",
        CustomerPhone: null);

    [Fact]
    public async Task VerifyAsync_MissingCredentials_FailsWithoutCallingHttp()
    {
        var handler = FakeHttpMessageHandler.ReturningJson(HttpStatusCode.OK, "{}");
        var provider = new MetaTrackingProvider(new HttpClient(handler), NullLogger<MetaTrackingProvider>.Instance);

        var result = await provider.VerifyAsync(new ProviderCredentialSet(new Dictionary<string, string>()), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Ads.Meta.MissingCredentials", result.Error.Code);
        Assert.Null(handler.LastRequest);
    }

    [Fact]
    public async Task VerifyAsync_PostsAnEventToTheEventsEndpoint_NotAGetOnThePixelNode()
    {
        // A CAPI token can POST /events but usually can't GET the pixel node, so verify must
        // exercise the same /events POST the live dispatch uses (see MetaTrackingProvider).
        var handler = FakeHttpMessageHandler.ReturningJson(HttpStatusCode.OK, "{\"events_received\":1,\"messages\":[],\"fbtrace_id\":\"abc\"}");
        var provider = new MetaTrackingProvider(new HttpClient(handler), NullLogger<MetaTrackingProvider>.Instance);

        var result = await provider.VerifyAsync(Credentials(), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(HttpMethod.Post, handler.LastRequest!.Method);
        Assert.Contains("/1234567890/events", handler.LastRequest!.RequestUri!.ToString());
        Assert.Contains("\"event_name\":\"PageView\"", handler.LastRequestBody);
        // Must carry a customer-information parameter or Meta rejects with subcode 2804050.
        Assert.Contains("\"external_id\":[", handler.LastRequestBody);
        // A PageView carries no commerce data, so no empty custom_data object should be sent.
        Assert.DoesNotContain("custom_data", handler.LastRequestBody);
    }

    [Fact]
    public async Task VerifyAsync_ForwardsTestEventCodeSoItDoesNotPolluteRealData()
    {
        var handler = FakeHttpMessageHandler.ReturningJson(HttpStatusCode.OK, "{\"events_received\":1}");
        var provider = new MetaTrackingProvider(new HttpClient(handler), NullLogger<MetaTrackingProvider>.Instance);

        await provider.VerifyAsync(Credentials("TEST12345"), CancellationToken.None);

        Assert.Contains("\"test_event_code\":\"TEST12345\"", handler.LastRequestBody);
    }

    [Fact]
    public async Task VerifyAsync_200ButZeroEventsReceived_Fails()
    {
        var handler = FakeHttpMessageHandler.ReturningJson(HttpStatusCode.OK, "{\"events_received\":0,\"messages\":[]}");
        var provider = new MetaTrackingProvider(new HttpClient(handler), NullLogger<MetaTrackingProvider>.Instance);

        var result = await provider.VerifyAsync(Credentials(), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Ads.Meta.VerificationFailed", result.Error.Code);
    }

    [Fact]
    public async Task VerifyAsync_InvalidToken_FailsWithExtractedMessage()
    {
        var handler = FakeHttpMessageHandler.ReturningJson(
            HttpStatusCode.BadRequest, "{\"error\":{\"message\":\"Invalid OAuth access token\",\"code\":190}}");
        var provider = new MetaTrackingProvider(new HttpClient(handler), NullLogger<MetaTrackingProvider>.Instance);

        var result = await provider.VerifyAsync(Credentials(), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Invalid OAuth access token", result.Error.Message);
    }

    [Fact]
    public async Task SendAsync_Success_MapsPayloadIntoGraphEventShapeAndHashesPii()
    {
        var handler = FakeHttpMessageHandler.ReturningJson(HttpStatusCode.OK, "{\"events_received\":1}");
        var provider = new MetaTrackingProvider(new HttpClient(handler), NullLogger<MetaTrackingProvider>.Instance);
        var eventKey = Guid.NewGuid();

        var result = await provider.SendAsync(PurchasePayload(eventKey), Credentials(), CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Equal(200, result.HttpStatus);
        Assert.Contains("\"event_name\":\"Purchase\"", handler.LastRequestBody);
        Assert.Contains($"\"event_id\":\"{eventKey}\"", handler.LastRequestBody);
        Assert.Contains("\"value\":99.99", handler.LastRequestBody);
        Assert.DoesNotContain("shopper@example.com", handler.LastRequestBody); // email must be hashed, never sent in plaintext
        Assert.Contains("\"em\":[", handler.LastRequestBody);
    }

    [Fact]
    public async Task SendAsync_IncludesTestEventCodeWhenConfigured()
    {
        var handler = FakeHttpMessageHandler.ReturningJson(HttpStatusCode.OK, "{}");
        var provider = new MetaTrackingProvider(new HttpClient(handler), NullLogger<MetaTrackingProvider>.Instance);

        await provider.SendAsync(PurchasePayload(Guid.NewGuid()), Credentials("TEST12345"), CancellationToken.None);

        Assert.Contains("\"test_event_code\":\"TEST12345\"", handler.LastRequestBody);
    }

    [Fact]
    public async Task SendAsync_ProviderError_ReturnsFailureWithExtractedMessage()
    {
        var handler = FakeHttpMessageHandler.ReturningJson(
            HttpStatusCode.InternalServerError, "{\"error\":{\"message\":\"Temporary server error\",\"code\":2}}");
        var provider = new MetaTrackingProvider(new HttpClient(handler), NullLogger<MetaTrackingProvider>.Instance);

        var result = await provider.SendAsync(PurchasePayload(Guid.NewGuid()), Credentials(), CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.Equal(500, result.HttpStatus);
        Assert.Equal("Temporary server error", result.ErrorMessage);
    }
}
