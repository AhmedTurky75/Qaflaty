using System.Net;

namespace Qaflaty.UnitTests.Infrastructure.Ads;

/// <summary>Hand-written stand-in HTTP handler for provider adapter tests (no mocking library, matching the project's fake-based test style).</summary>
internal sealed class FakeHttpMessageHandler : HttpMessageHandler
{
    private readonly Func<HttpRequestMessage, HttpResponseMessage> _responder;

    public HttpRequestMessage? LastRequest { get; private set; }
    public string? LastRequestBody { get; private set; }

    public FakeHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responder)
    {
        _responder = responder;
    }

    public static FakeHttpMessageHandler ReturningJson(HttpStatusCode statusCode, string json)
        => new(_ => new HttpResponseMessage(statusCode) { Content = new StringContent(json) });

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        LastRequest = request;
        LastRequestBody = request.Content != null ? await request.Content.ReadAsStringAsync(cancellationToken) : null;
        return _responder(request);
    }
}
