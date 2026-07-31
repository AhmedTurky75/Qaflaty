using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Storefront.Commands.SetDownsellTriggerRules;
using Qaflaty.Application.Storefront.Commands.UpdateDownsellSettings;
using Qaflaty.Application.Storefront.Queries.GetDownsellAnalytics;
using Qaflaty.Application.Storefront.Queries.GetDownsellSettings;
using Qaflaty.Application.Storefront.Queries.GetDownsellTriggerRules;
using Qaflaty.Application.Storefront.Recommendations.ManualDownSell;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Api.Controllers;

[Route("api/stores/{storeId:guid}/downsell")]
[Authorize]
public class MerchantDownsellController : ApiController
{
    [HttpGet("settings")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSettings(Guid storeId, CancellationToken ct)
    {
        var result = await Sender.Send(new GetDownsellSettingsQuery(new StoreId(storeId)), ct);
        return HandleResult(result);
    }

    [HttpPut("settings")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetSettings(
        Guid storeId, [FromBody] DownsellSettingsRequest request, CancellationToken ct)
    {
        var result = await Sender.Send(
            new UpdateDownsellSettingsCommand(
                new StoreId(storeId), request.Enabled, request.MaxShowsPerSession,
                request.MinIntervalSeconds, request.ExcludeOutOfStock), ct);
        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }

    [HttpGet("trigger-rules")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTriggerRules(Guid storeId, CancellationToken ct)
    {
        var result = await Sender.Send(new GetDownsellTriggerRulesQuery(new StoreId(storeId)), ct);
        return HandleResult(result);
    }

    [HttpPut("trigger-rules")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetTriggerRules(
        Guid storeId, [FromBody] SetTriggerRulesRequest request, CancellationToken ct)
    {
        var result = await Sender.Send(
            new SetDownsellTriggerRulesCommand(new StoreId(storeId), request.Rules ?? []), ct);
        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }

    [HttpGet("products/{productId:guid}/offer")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOffer(Guid storeId, Guid productId, CancellationToken ct)
    {
        var result = await Sender.Send(
            new GetDownsellOfferQuery(new StoreId(storeId), new ProductId(productId)), ct);
        return HandleResult(result);
    }

    [HttpPut("products/{productId:guid}/offer")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetOffer(
        Guid storeId, Guid productId, [FromBody] SetDownsellOfferRequest request, CancellationToken ct)
    {
        var command = new SetDownsellOfferCommand(
            new StoreId(storeId),
            new ProductId(productId),
            request.DownsellProductIds ?? [],
            request.PromoCodeId,
            request.IsEnabled);

        var result = await Sender.Send(command, ct);
        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }

    [HttpGet("analytics")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAnalytics(
        Guid storeId, [FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken ct)
    {
        var result = await Sender.Send(new GetDownsellAnalyticsQuery(new StoreId(storeId), from, to), ct);
        return HandleResult(result);
    }
}

public record DownsellSettingsRequest(bool Enabled, int MaxShowsPerSession, int MinIntervalSeconds, bool ExcludeOutOfStock);
public record SetTriggerRulesRequest(List<DownsellTriggerRuleInput>? Rules);
public record SetDownsellOfferRequest(List<Guid>? DownsellProductIds, Guid? PromoCodeId, bool IsEnabled);
