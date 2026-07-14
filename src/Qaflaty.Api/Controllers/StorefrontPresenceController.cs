using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Analytics.Commands.RecordHeartbeat;
using Qaflaty.Application.Analytics.Commands.RemovePresence;
using Qaflaty.Application.Common.Interfaces;

namespace Qaflaty.Api.Controllers;

/// <summary>
/// Unauthenticated presence endpoints for the storefront — powers the merchant dashboard's
/// live "active users" / "active users per product" metrics. Store identity comes from
/// <see cref="ITenantContext"/> (X-Store-Slug / X-Custom-Domain), never from the request body,
/// so a visitor can only ever affect their own store's counts. Visitor identity is the
/// authenticated customer id (JWT, if present) or the X-Guest-Id header.
/// </summary>
[Route("api/storefront/presence")]
public class StorefrontPresenceController : ApiController
{
    private ITenantContext TenantContext =>
        HttpContext.RequestServices.GetRequiredService<ITenantContext>();

    [HttpPost("heartbeat")]
    public async Task<IActionResult> Heartbeat([FromBody] PresenceHeartbeatRequest request, CancellationToken ct)
    {
        if (!TenantContext.IsResolved || TenantContext.CurrentStoreId == null)
            return NotFound(new { error = "Store.NotResolved", message = "Store context not resolved" });

        var command = new RecordHeartbeatCommand(
            TenantContext.CurrentStoreId.Value.Value,
            CurrentUserService.CustomerId?.Value,
            Request.Headers["X-Guest-Id"].FirstOrDefault(),
            request.ProductId);

        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Best-effort "leave" signal fired via <c>fetch(..., {keepalive:true})</c> on tab/browser
    /// close. Always returns 204 — a beacon call must never surface an error to the departing page.
    /// </summary>
    [HttpPost("leave")]
    public async Task<IActionResult> Leave(CancellationToken ct)
    {
        if (!TenantContext.IsResolved || TenantContext.CurrentStoreId == null)
            return NoContent();

        var command = new RemovePresenceCommand(
            TenantContext.CurrentStoreId.Value.Value,
            CurrentUserService.CustomerId?.Value,
            Request.Headers["X-Guest-Id"].FirstOrDefault());

        await Sender.Send(command, ct);
        return NoContent();
    }
}

public record PresenceHeartbeatRequest(Guid? ProductId);
