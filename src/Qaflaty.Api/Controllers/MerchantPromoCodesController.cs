using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Catalog.Commands.CreatePromoCode;
using Qaflaty.Application.Catalog.Commands.DeletePromoCode;
using Qaflaty.Application.Catalog.Commands.TogglePromoCode;
using Qaflaty.Application.Catalog.Commands.UpdatePromoCode;
using Qaflaty.Application.Catalog.Queries.GetPromoCodes;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Api.Controllers;

[Route("api/stores/{storeId:guid}/promo-codes")]
[Authorize]
public class MerchantPromoCodesController : ApiController
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAll(Guid storeId, CancellationToken ct)
    {
        var result = await Sender.Send(new GetPromoCodesQuery(new StoreId(storeId)), ct);
        return HandleResult(result);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(
        Guid storeId, [FromBody] CreatePromoCodeRequest request, CancellationToken ct)
    {
        var command = new CreatePromoCodeCommand(
            new StoreId(storeId),
            request.Code,
            request.Description,
            request.DiscountType,
            request.Value,
            request.MinimumOrderAmount,
            request.MaxDiscountAmount,
            request.StartsAt,
            request.ExpiresAt,
            request.UsageLimit,
            request.UsageLimitPerCustomer,
            request.UnlimitedPerCustomer);

        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid storeId, Guid id, [FromBody] UpdatePromoCodeRequest request, CancellationToken ct)
    {
        var command = new UpdatePromoCodeCommand(
            new PromoCodeId(id),
            new StoreId(storeId),
            request.Description,
            request.DiscountType,
            request.Value,
            request.MinimumOrderAmount,
            request.MaxDiscountAmount,
            request.StartsAt,
            request.ExpiresAt,
            request.UsageLimit,
            request.UsageLimitPerCustomer,
            request.UnlimitedPerCustomer);

        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }

    [HttpPost("{id:guid}/toggle")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Toggle(
        Guid storeId, Guid id, [FromBody] TogglePromoCodeRequest request, CancellationToken ct)
    {
        var result = await Sender.Send(
            new TogglePromoCodeCommand(new PromoCodeId(id), new StoreId(storeId), request.IsActive), ct);

        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid storeId, Guid id, CancellationToken ct)
    {
        var result = await Sender.Send(
            new DeletePromoCodeCommand(new PromoCodeId(id), new StoreId(storeId)), ct);

        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }
}

public record CreatePromoCodeRequest(
    string Code,
    string? Description,
    string DiscountType,
    decimal Value,
    decimal? MinimumOrderAmount,
    decimal? MaxDiscountAmount,
    DateTime? StartsAt,
    DateTime? ExpiresAt,
    int? UsageLimit,
    int? UsageLimitPerCustomer,
    bool UnlimitedPerCustomer = false);

public record UpdatePromoCodeRequest(
    string? Description,
    string DiscountType,
    decimal Value,
    decimal? MinimumOrderAmount,
    decimal? MaxDiscountAmount,
    DateTime? StartsAt,
    DateTime? ExpiresAt,
    int? UsageLimit,
    int? UsageLimitPerCustomer,
    bool UnlimitedPerCustomer = false);

public record TogglePromoCodeRequest(bool IsActive);
