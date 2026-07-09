using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Ads.Commands.ConnectProvider;
using Qaflaty.Application.Ads.Commands.DisconnectProvider;
using Qaflaty.Application.Ads.Commands.ReplayEvent;
using Qaflaty.Application.Ads.Commands.SendTestEvent;
using Qaflaty.Application.Ads.Commands.VerifyProvider;
using Qaflaty.Application.Ads.Queries.GetDashboard;
using Qaflaty.Application.Ads.Queries.GetDiagnostics;
using Qaflaty.Application.Ads.Queries.GetEventTimeline;
using Qaflaty.Application.Ads.Queries.GetMonitoring;
using Qaflaty.Application.Ads.Queries.GetProviders;
using Qaflaty.Application.Ads.Queries.GetTrackingLogs;
using Qaflaty.Domain.Ads.Enums;

namespace Qaflaty.Api.Controllers;

[Route("api/stores/{storeId:guid}/ads")]
[Authorize(Policy = "CanManageAds")]
public class MerchantAdsController : ApiController
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(Guid storeId, CancellationToken ct)
    {
        var result = await Sender.Send(new GetDashboardQuery(storeId), ct);
        return HandleResult(result);
    }

    [HttpGet("providers")]
    public async Task<IActionResult> GetProviders(Guid storeId, CancellationToken ct)
    {
        var result = await Sender.Send(new GetProvidersQuery(storeId), ct);
        return HandleResult(result);
    }

    [HttpPost("providers/{provider}")]
    public async Task<IActionResult> ConnectProvider(
        Guid storeId, string provider, [FromBody] ConnectProviderRequest request, CancellationToken ct)
    {
        if (!Enum.TryParse<AdProvider>(provider, true, out var providerEnum))
            return BadRequest(new { error = "Ads.InvalidProvider", message = $"Unknown provider '{provider}'" });

        var command = new ConnectProviderCommand(
            storeId, providerEnum, request.Credentials, request.BrowserTrackingEnabled, request.ServerTrackingEnabled);

        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }

    [HttpPost("providers/{provider}/verify")]
    public async Task<IActionResult> VerifyProvider(Guid storeId, string provider, CancellationToken ct)
    {
        if (!Enum.TryParse<AdProvider>(provider, true, out var providerEnum))
            return BadRequest(new { error = "Ads.InvalidProvider", message = $"Unknown provider '{provider}'" });

        var result = await Sender.Send(new VerifyProviderCommand(storeId, providerEnum), ct);
        return HandleResult(result);
    }

    [HttpPost("providers/{provider}/disconnect")]
    public async Task<IActionResult> DisconnectProvider(Guid storeId, string provider, CancellationToken ct)
    {
        if (!Enum.TryParse<AdProvider>(provider, true, out var providerEnum))
            return BadRequest(new { error = "Ads.InvalidProvider", message = $"Unknown provider '{provider}'" });

        var result = await Sender.Send(new DisconnectProviderCommand(storeId, providerEnum), ct);
        return HandleResult(result);
    }

    [HttpPost("test/{eventType}")]
    public async Task<IActionResult> SendTestEvent(Guid storeId, string eventType, CancellationToken ct)
    {
        if (!Enum.TryParse<TrackingEventType>(eventType, true, out var eventTypeEnum))
            return BadRequest(new { error = "Ads.InvalidEventType", message = $"Unknown event type '{eventType}'" });

        var result = await Sender.Send(new SendTestEventCommand(storeId, eventTypeEnum), ct);
        return HandleResult(result);
    }

    [HttpGet("logs")]
    public async Task<IActionResult> GetLogs(
        Guid storeId,
        [FromQuery] TrackingEventType? eventType,
        [FromQuery] AdProvider? provider,
        [FromQuery] DispatchStatus? status,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken ct = default)
    {
        var query = new GetTrackingLogsQuery(storeId, eventType, provider, status, from, to, pageNumber, pageSize);
        var result = await Sender.Send(query, ct);
        return HandleResult(result);
    }

    [HttpGet("events/{orderId:guid}/timeline")]
    public async Task<IActionResult> GetEventTimeline(Guid storeId, Guid orderId, CancellationToken ct)
    {
        var result = await Sender.Send(new GetEventTimelineQuery(storeId, orderId), ct);
        return HandleResult(result);
    }

    [HttpGet("diagnostics")]
    public async Task<IActionResult> GetDiagnostics(Guid storeId, CancellationToken ct)
    {
        var result = await Sender.Send(new GetDiagnosticsQuery(storeId), ct);
        return HandleResult(result);
    }

    [HttpGet("monitoring")]
    public async Task<IActionResult> GetMonitoring(Guid storeId, CancellationToken ct)
    {
        var result = await Sender.Send(new GetMonitoringQuery(storeId), ct);
        return HandleResult(result);
    }

    [HttpPost("replay/{trackingEventId:guid}/{dispatchLogId:guid}")]
    public async Task<IActionResult> ReplayEvent(Guid storeId, Guid trackingEventId, Guid dispatchLogId, CancellationToken ct)
    {
        var result = await Sender.Send(new ReplayEventCommand(storeId, trackingEventId, dispatchLogId), ct);
        return HandleResult(result);
    }
}

public record ConnectProviderRequest(
    Dictionary<string, string> Credentials,
    bool BrowserTrackingEnabled,
    bool ServerTrackingEnabled);
