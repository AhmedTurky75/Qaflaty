using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Ads.Commands.IngestBrowserEvent;
using Qaflaty.Application.Ads.Queries.GetStorefrontTrackingConfig;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Ads.Enums;

namespace Qaflaty.Api.Controllers;

[ApiController]
[Route("api/storefront/tracking")]
public class StorefrontTrackingController : ApiController
{
    private readonly ITenantContext _tenantContext;

    public StorefrontTrackingController(ITenantContext tenantContext)
    {
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// Public, non-secret pixel config (e.g. Meta Pixel ID) for every provider the store
    /// has enabled for browser tracking. Called once on storefront app bootstrap so the
    /// SPA can load each provider's client script automatically — no code snippet pasting.
    /// </summary>
    [HttpGet("config")]
    public async Task<IActionResult> GetConfig(CancellationToken ct)
    {
        if (!_tenantContext.IsResolved || _tenantContext.CurrentStoreId == null)
            return NotFound(new { error = "Store.NotResolved", message = "Store context not resolved" });

        var result = await Sender.Send(new GetStorefrontTrackingConfigQuery(_tenantContext.CurrentStoreId.Value.Value), ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Called by the storefront right after it fires a browser pixel event, so the backend
    /// can mirror it server-side (CAPI/Events API/Measurement Protocol) using the same
    /// event id for provider-side deduplication. Never blocks the browser event itself —
    /// the pixel has already fired by the time this call is made.
    /// </summary>
    [HttpPost("events")]
    public async Task<IActionResult> IngestEvent([FromBody] IngestTrackingEventRequest request, CancellationToken ct)
    {
        if (!_tenantContext.IsResolved || _tenantContext.CurrentStoreId == null)
            return NotFound(new { error = "Store.NotResolved", message = "Store context not resolved" });

        if (!Enum.TryParse<TrackingEventType>(request.EventType, true, out var eventType))
            return BadRequest(new { error = "Ads.InvalidEventType", message = $"Unknown event type '{request.EventType}'" });

        var userAgent = Request.Headers["User-Agent"].ToString();

        var command = new IngestBrowserEventCommand(
            _tenantContext.CurrentStoreId.Value.Value,
            request.EventKey,
            eventType,
            request.Value,
            request.Currency,
            request.Contents?.Select(c => new TrackingContentItemInput(c.ContentId, c.Quantity, c.Price)).ToList(),
            request.OrderId,
            request.CustomerRef,
            request.PageUrl,
            request.CustomerEmail,
            request.CustomerPhone,
            GetClientIpAddress(),
            string.IsNullOrEmpty(userAgent) ? null : userAgent);

        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Real visitor IP for Conversions API matching. Prefers X-Forwarded-For (set by a reverse
    /// proxy/load balancer in front of the API) over the raw connection IP, since behind a proxy
    /// RemoteIpAddress is the proxy's own address, not the visitor's.
    /// </summary>
    private string? GetClientIpAddress()
    {
        var forwardedFor = Request.Headers["X-Forwarded-For"].ToString();
        if (!string.IsNullOrWhiteSpace(forwardedFor))
            return forwardedFor.Split(',')[0].Trim();

        return HttpContext.Connection.RemoteIpAddress?.ToString();
    }
}

public record TrackingContentItemRequest(string ContentId, int Quantity, decimal? Price);

public record IngestTrackingEventRequest(
    Guid EventKey,
    string EventType,
    decimal? Value,
    string? Currency,
    List<TrackingContentItemRequest>? Contents,
    Guid? OrderId,
    string? CustomerRef,
    string? PageUrl,
    string? CustomerEmail,
    string? CustomerPhone);
