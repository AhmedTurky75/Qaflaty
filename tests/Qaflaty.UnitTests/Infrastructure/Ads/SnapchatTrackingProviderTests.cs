using System.Net;
using Microsoft.Extensions.Logging.Abstractions;
using Qaflaty.Application.Ads.Abstractions;
using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Infrastructure.Services.Ads.Providers;
using Xunit;

namespace Qaflaty.UnitTests.Infrastructure.Ads;

public class SnapchatTrackingProviderTests
{
    private static ProviderCredentialSet Credentials() => new(new Dictionary<string, string>
    {
        ["pixelId"] = "snap-pixel-1",
        ["accessToken"] = "snap-token"
    });

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
        Contents: [new TrackingContentItem("prod-1", 2, 49.99m)],
        PageUrl: "https://store.example.com/order-confirmation",
        ClientIpAddress: "1.2.3.4",
        ClientUserAgent: "test-agent",
        CustomerEmail: "shopper@example.com",
        CustomerPhone: null);

    [Fact]
    public async Task VerifyAsync_MissingCredentials_FailsWithoutCallingHttp()
    {
        var handler = FakeHttpMessageHandler.ReturningJson(HttpStatusCode.OK, "{}");
        var provider = new SnapchatTrackingProvider(new HttpClient(handler), NullLogger<SnapchatTrackingProvider>.Instance);

        var result = await provider.VerifyAsync(new ProviderCredentialSet(new Dictionary<string, string>()), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Ads.Snapchat.MissingCredentials", result.Error.Code);
        Assert.Null(handler.LastRequest);
    }

    [Fact]
    public async Task SendAsync_PostsToPerPixelEventsEndpointWithTokenQuery()
    {
        var handler = FakeHttpMessageHandler.ReturningJson(HttpStatusCode.OK, "{\"status\":\"SUCCESS\"}");
        var provider = new SnapchatTrackingProvider(new HttpClient(handler), NullLogger<SnapchatTrackingProvider>.Instance);

        var result = await provider.SendAsync(PurchasePayload(Guid.NewGuid()), Credentials(), CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Equal(HttpMethod.Post, handler.LastRequest!.Method);
        Assert.Contains("/v3/snap-pixel-1/events", handler.LastRequest!.RequestUri!.ToString());
        Assert.Contains("access_token=snap-token", handler.LastRequest!.RequestUri!.ToString());
    }

    [Fact]
    public async Task SendAsync_MapsPurchaseToUpperSnakeAndHashesEmail()
    {
        var handler = FakeHttpMessageHandler.ReturningJson(HttpStatusCode.OK, "{\"status\":\"SUCCESS\"}");
        var provider = new SnapchatTrackingProvider(new HttpClient(handler), NullLogger<SnapchatTrackingProvider>.Instance);
        var eventKey = Guid.NewGuid();

        await provider.SendAsync(PurchasePayload(eventKey), Credentials(), CancellationToken.None);

        Assert.Contains("\"event_name\":\"PURCHASE\"", handler.LastRequestBody);      // Purchase -> PURCHASE
        Assert.Contains($"\"event_id\":\"{eventKey}\"", handler.LastRequestBody);
        Assert.Contains("\"em\":[", handler.LastRequestBody);                          // hashed email present
        Assert.DoesNotContain("shopper@example.com", handler.LastRequestBody);         // never plaintext
        Assert.Contains("\"num_items\":2", handler.LastRequestBody);                   // quantities summed
    }

    [Fact]
    public async Task SendAsync_ProviderError_ReturnsFailureWithExtractedMessage()
    {
        var handler = FakeHttpMessageHandler.ReturningJson(
            HttpStatusCode.BadRequest, "{\"error\":{\"message\":\"Invalid pixel id\"}}");
        var provider = new SnapchatTrackingProvider(new HttpClient(handler), NullLogger<SnapchatTrackingProvider>.Instance);

        var result = await provider.SendAsync(PurchasePayload(Guid.NewGuid()), Credentials(), CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.Equal("Invalid pixel id", result.ErrorMessage);
    }
}
