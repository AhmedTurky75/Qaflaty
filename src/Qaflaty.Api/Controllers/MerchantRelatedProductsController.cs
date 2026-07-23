using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Storefront.Commands.UpdateCrossSellSettings;
using Qaflaty.Application.Storefront.Commands.UpdateUpSellSettings;
using Qaflaty.Application.Storefront.Queries.GetCrossSellSettings;
using Qaflaty.Application.Storefront.Queries.GetUpSellSettings;
using Qaflaty.Application.Storefront.Recommendations.ManualCrossSell;
using Qaflaty.Application.Storefront.Recommendations.ManualRelated;
using Qaflaty.Application.Storefront.Recommendations.ManualUpSell;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Api.Controllers;

[Route("api/stores/{storeId:guid}")]
[Authorize]
public class MerchantRelatedProductsController : ApiController
{
    [HttpGet("products/{productId:guid}/related-products")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetManualRelated(Guid storeId, Guid productId, CancellationToken ct)
    {
        var query = new GetManualRelatedProductsQuery(new StoreId(storeId), new ProductId(productId));
        var result = await Sender.Send(query, ct);
        return HandleResult(result);
    }

    [HttpPut("products/{productId:guid}/related-products")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetManualRelated(
        Guid storeId, Guid productId, [FromBody] SetRelatedProductsRequest request, CancellationToken ct)
    {
        var command = new SetManualRelatedProductsCommand(
            new StoreId(storeId),
            new ProductId(productId),
            request.RelatedProductIds ?? []);

        var result = await Sender.Send(command, ct);
        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }

    [HttpPut("recommendation-settings/related-mode")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetRelatedMode(
        Guid storeId, [FromBody] RelatedModeRequest request, CancellationToken ct)
    {
        var result = await Sender.Send(
            new UpdateRelatedProductsModeCommand(new StoreId(storeId), request.Manual), ct);
        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }

    [HttpGet("products/{productId:guid}/cross-sell")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCrossSell(Guid storeId, Guid productId, CancellationToken ct)
    {
        var query = new GetManualCrossSellProductsQuery(new StoreId(storeId), new ProductId(productId));
        var result = await Sender.Send(query, ct);
        return HandleResult(result);
    }

    [HttpPut("products/{productId:guid}/cross-sell")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetCrossSell(
        Guid storeId, Guid productId, [FromBody] SetCrossSellRequest request, CancellationToken ct)
    {
        var command = new SetCrossSellProductsCommand(
            new StoreId(storeId),
            new ProductId(productId),
            request.CrossSellProductIds ?? []);

        var result = await Sender.Send(command, ct);
        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }

    [HttpGet("recommendation-settings/cross-sell")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCrossSellSettings(Guid storeId, CancellationToken ct)
    {
        var result = await Sender.Send(new GetCrossSellSettingsQuery(new StoreId(storeId)), ct);
        return HandleResult(result);
    }

    [HttpPut("recommendation-settings/cross-sell")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetCrossSellSettings(
        Guid storeId, [FromBody] CrossSellSettingsRequest request, CancellationToken ct)
    {
        var result = await Sender.Send(
            new UpdateCrossSellSettingsCommand(
                new StoreId(storeId), request.Enabled, request.Limit, request.ExcludeOutOfStock), ct);
        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }

    [HttpGet("products/{productId:guid}/upsell")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUpSell(Guid storeId, Guid productId, CancellationToken ct)
    {
        var query = new GetManualUpSellProductsQuery(new StoreId(storeId), new ProductId(productId));
        var result = await Sender.Send(query, ct);
        return HandleResult(result);
    }

    [HttpPut("products/{productId:guid}/upsell")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetUpSell(
        Guid storeId, Guid productId, [FromBody] SetUpSellRequest request, CancellationToken ct)
    {
        var command = new SetUpSellProductsCommand(
            new StoreId(storeId),
            new ProductId(productId),
            request.UpSellProductIds ?? []);

        var result = await Sender.Send(command, ct);
        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }

    [HttpGet("recommendation-settings/upsell")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUpSellSettings(Guid storeId, CancellationToken ct)
    {
        var result = await Sender.Send(new GetUpSellSettingsQuery(new StoreId(storeId)), ct);
        return HandleResult(result);
    }

    [HttpPut("recommendation-settings/upsell")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetUpSellSettings(
        Guid storeId, [FromBody] UpSellSettingsRequest request, CancellationToken ct)
    {
        var result = await Sender.Send(
            new UpdateUpSellSettingsCommand(
                new StoreId(storeId), request.Enabled, request.Limit, request.ExcludeOutOfStock), ct);
        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }
}

public record SetRelatedProductsRequest(List<Guid>? RelatedProductIds);
public record RelatedModeRequest(bool Manual);
public record SetCrossSellRequest(List<Guid>? CrossSellProductIds);
public record CrossSellSettingsRequest(bool Enabled, int Limit, bool ExcludeOutOfStock);
public record SetUpSellRequest(List<Guid>? UpSellProductIds);
public record UpSellSettingsRequest(bool Enabled, int Limit, bool ExcludeOutOfStock);
