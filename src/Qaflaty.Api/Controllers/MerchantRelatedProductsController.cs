using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Storefront.Recommendations.ManualRelated;
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
}

public record SetRelatedProductsRequest(List<Guid>? RelatedProductIds);
public record RelatedModeRequest(bool Manual);
