using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Storefront.Commands.EvaluateDownsell;
using Qaflaty.Application.Storefront.Commands.RecordDownsellEvent;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Enums;

namespace Qaflaty.Api.Controllers;

/// <summary>
/// Works for both guest and authenticated shoppers: identity is either the logged-in customer id
/// or a client-supplied session id, matching the pattern used by product-view tracking. Never
/// wired up on checkout or post-purchase routes on the storefront side.
/// </summary>
[ApiController]
[Route("api/storefront/downsell")]
public class StorefrontDownsellController : ApiController
{
    private readonly ITenantContext _tenantContext;

    public StorefrontDownsellController(ITenantContext tenantContext)
    {
        _tenantContext = tenantContext;
    }

    [HttpPost("evaluate")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Evaluate([FromBody] EvaluateDownsellRequest request, CancellationToken ct)
    {
        if (!_tenantContext.IsResolved || _tenantContext.CurrentStoreId == null)
            return NotFound(new { error = "Store.NotResolved", message = "Store context not resolved" });

        if (!Enum.TryParse<DownsellSurface>(request.Surface, true, out var surface))
            return BadRequest(new { error = "Downsell.InvalidSurface", message = $"Unknown surface '{request.Surface}'" });

        if (!Enum.TryParse<DownsellTriggerType>(request.TriggerType, true, out var triggerType))
            return BadRequest(new { error = "Downsell.InvalidTriggerType", message = $"Unknown trigger type '{request.TriggerType}'" });

        var sessionKey = ResolveSessionKey(request.SessionId);
        if (sessionKey is null)
            return BadRequest(new { error = "Downsell.MissingSession", message = "A session id is required for guest shoppers" });

        var command = new EvaluateDownsellCommand(
            _tenantContext.CurrentStoreId.Value,
            surface,
            triggerType,
            request.ProductId is { } productId ? new ProductId(productId) : null,
            sessionKey,
            request.ElapsedSeconds);

        var result = await Sender.Send(command, ct);
        if (result.IsFailure)
            return HandleResult(result);

        return result.Value is null ? NoContent() : Ok(result.Value);
    }

    [HttpPost("events")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RecordEvent([FromBody] RecordDownsellEventRequest request, CancellationToken ct)
    {
        if (!_tenantContext.IsResolved || _tenantContext.CurrentStoreId == null)
            return NotFound(new { error = "Store.NotResolved", message = "Store context not resolved" });

        if (!Enum.TryParse<DownsellEventType>(request.EventType, true, out var eventType))
            return BadRequest(new { error = "Downsell.InvalidEventType", message = $"Unknown event type '{request.EventType}'" });

        DownsellTriggerType? triggerType = null;
        if (!string.IsNullOrWhiteSpace(request.TriggerType))
        {
            if (!Enum.TryParse<DownsellTriggerType>(request.TriggerType, true, out var parsed))
                return BadRequest(new { error = "Downsell.InvalidTriggerType", message = $"Unknown trigger type '{request.TriggerType}'" });
            triggerType = parsed;
        }

        var sessionKey = ResolveSessionKey(request.SessionId);
        if (sessionKey is null)
            return BadRequest(new { error = "Downsell.MissingSession", message = "A session id is required for guest shoppers" });

        var command = new RecordDownsellEventCommand(
            _tenantContext.CurrentStoreId.Value,
            request.ProductId is { } productId ? new ProductId(productId) : null,
            eventType,
            triggerType,
            sessionKey);

        var result = await Sender.Send(command, ct);
        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }

    private string? ResolveSessionKey(string? sessionId)
    {
        var customerId = CurrentUserService.CustomerId;
        if (customerId is not null)
            return $"customer:{customerId.Value.Value}";

        return string.IsNullOrWhiteSpace(sessionId) ? null : $"guest:{sessionId}";
    }
}

public record EvaluateDownsellRequest(
    string Surface, string TriggerType, Guid? ProductId, string? SessionId, int? ElapsedSeconds);

public record RecordDownsellEventRequest(
    string EventType, string? TriggerType, Guid? ProductId, string? SessionId);
