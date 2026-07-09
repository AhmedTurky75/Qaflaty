using System.Diagnostics;
using Microsoft.Extensions.Logging;
using Qaflaty.Application.Ads.Abstractions;
using Qaflaty.Domain.Ads.Enums;

namespace Qaflaty.Infrastructure.Services.Ads.Providers;

/// <summary>
/// Template Method base for provider adapters: centralizes HTTP timing, response capture,
/// and error classification so each concrete provider (<see cref="MetaTrackingProvider"/>,
/// TikTok, ...) only needs to build its own payload/endpoint and call
/// <see cref="ExecuteAsync"/>.
/// </summary>
public abstract class TrackingProviderBase
{
    private readonly ILogger _logger;

    protected TrackingProviderBase(ILogger logger)
    {
        _logger = logger;
    }

    public abstract AdProvider Provider { get; }

    protected async Task<ProviderDispatchResult> ExecuteAsync(
        Func<Task<HttpResponseMessage>> send,
        Func<string, string?> extractErrorMessage)
    {
        var stopwatch = Stopwatch.StartNew();
        try
        {
            using var response = await send();
            var body = await response.Content.ReadAsStringAsync();
            stopwatch.Stop();

            if (response.IsSuccessStatusCode)
                return ProviderDispatchResult.Success((int)response.StatusCode, body, (int)stopwatch.ElapsedMilliseconds);

            var errorMessage = extractErrorMessage(body) ?? $"Provider returned HTTP {(int)response.StatusCode}";
            _logger.LogWarning("{Provider} dispatch failed with {Status}: {Body}", Provider, response.StatusCode, body);
            return ProviderDispatchResult.Failure((int)response.StatusCode, body, errorMessage, (int)stopwatch.ElapsedMilliseconds);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "{Provider} dispatch threw an exception", Provider);
            return ProviderDispatchResult.Failure(null, null, ex.Message, (int)stopwatch.ElapsedMilliseconds);
        }
    }
}
