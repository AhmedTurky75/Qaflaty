using System.Net;
using Microsoft.Extensions.Logging.Abstractions;
using Qaflaty.Application.Ads.Abstractions;
using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Infrastructure.Services.Ads.Providers;
using Xunit;

namespace Qaflaty.UnitTests.Infrastructure.Ads;

public class TikTokTrackingProviderTests
{
    private static ProviderCredentialSet Credentials(string? testEventCode = null)
    {
        var values = new Dictionary<string, string>
        {
            ["pixelId"] = "TIKTOKPIXEL01",
            ["accessToken"] = "tt-token"
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
        CustomerRef: "visitor-1",
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
        var handler = FakeHttpMessageHandler.ReturningJson(HttpStatusCode.OK, "{\"code\":0}");
        var provider = new TikTokTrackingProvider(new HttpClient(handler), NullLogger<TikTokTrackingProvider>.Instance);

        var result = await provider.VerifyAsync(new ProviderCredentialSet(new Dictionary<string, string>()), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Ads.TikTok.MissingCredentials", result.Error.Code);
        Assert.Null(handler.LastRequest);
    }

    [Fact]
    public async Task SendAsync_PostsToEventsEndpointWithAccessTokenHeader()
    {
        var handler = FakeHttpMessageHandler.ReturningJson(HttpStatusCode.OK, "{\"code\":0,\"message\":\"OK\"}");
        var provider = new TikTokTrackingProvider(new HttpClient(handler), NullLogger<TikTokTrackingProvider>.Instance);

        var result = await provider.SendAsync(PurchasePayload(Guid.NewGuid()), Credentials(), CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Equal(HttpMethod.Post, handler.LastRequest!.Method);
        Assert.Contains("/event/track/", handler.LastRequest!.RequestUri!.ToString());
        // Auth is a header, not a URL query param.
        Assert.True(handler.LastRequest.Headers.Contains("Access-Token"));
        Assert.DoesNotContain("access_token=", handler.LastRequest.RequestUri!.ToString());
    }

    [Fact]
    public async Task SendAsync_MapsPurchaseToCompletePaymentAndHashesPii()
    {
        var handler = FakeHttpMessageHandler.ReturningJson(HttpStatusCode.OK, "{\"code\":0}");
        var provider = new TikTokTrackingProvider(new HttpClient(handler), NullLogger<TikTokTrackingProvider>.Instance);
        var eventKey = Guid.NewGuid();

        await provider.SendAsync(PurchasePayload(eventKey), Credentials(), CancellationToken.None);

        Assert.Contains("\"event\":\"CompletePayment\"", handler.LastRequestBody);   // Purchase -> CompletePayment
        Assert.Contains($"\"event_id\":\"{eventKey}\"", handler.LastRequestBody);
        Assert.Contains("\"external_id\":", handler.LastRequestBody);                 // from CustomerRef
        Assert.DoesNotContain("shopper@example.com", handler.LastRequestBody);        // email hashed, never plaintext
    }

    [Fact]
    public async Task SendAsync_Http200ButNonZeroCode_IsTreatedAsFailure()
    {
        // TikTok returns HTTP 200 even for logical errors — success must be read from the body.
        var handler = FakeHttpMessageHandler.ReturningJson(
            HttpStatusCode.OK, "{\"code\":40001,\"message\":\"Invalid access token\"}");
        var provider = new TikTokTrackingProvider(new HttpClient(handler), NullLogger<TikTokTrackingProvider>.Instance);

        var result = await provider.SendAsync(PurchasePayload(Guid.NewGuid()), Credentials(), CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.Equal("Invalid access token", result.ErrorMessage);
    }

    [Fact]
    public async Task VerifyAsync_ForwardsTestEventCode()
    {
        var handler = FakeHttpMessageHandler.ReturningJson(HttpStatusCode.OK, "{\"code\":0}");
        var provider = new TikTokTrackingProvider(new HttpClient(handler), NullLogger<TikTokTrackingProvider>.Instance);

        await provider.VerifyAsync(Credentials("TT_TEST_1"), CancellationToken.None);

        Assert.Contains("\"test_event_code\":\"TT_TEST_1\"", handler.LastRequestBody);
        Assert.Contains("\"external_id\":", handler.LastRequestBody); // verify event carries a matching parameter
    }
}
