using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Storefront.Queries.ValidatePromoCode;

namespace Qaflaty.Api.Controllers;

[ApiController]
[Route("api/storefront/promo")]
public class StorefrontPromoController : ApiController
{
    private readonly ITenantContext _tenantContext;

    public StorefrontPromoController(ITenantContext tenantContext)
    {
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// Validates a promo code against the current cart contents and returns the discount preview.
    /// Public — works for both guests and logged-in shoppers.
    /// </summary>
    [HttpPost("validate")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Validate([FromBody] ValidatePromoRequest request, CancellationToken ct)
    {
        if (!_tenantContext.IsResolved || _tenantContext.CurrentStoreId == null)
            return NotFound(new { error = "Store.NotResolved", message = "Store context not resolved" });

        var items = (request.Items ?? [])
            .Select(i => new ValidatePromoCodeItem(i.ProductId, i.Quantity, i.VariantId))
            .ToList();

        var query = new ValidatePromoCodeQuery(
            _tenantContext.CurrentStoreId.Value,
            request.Code ?? string.Empty,
            items);

        var result = await Sender.Send(query, ct);
        return HandleResult(result);
    }
}

public record ValidatePromoRequest(string? Code, List<ValidatePromoItemRequest>? Items);

public record ValidatePromoItemRequest(Guid ProductId, int Quantity, Guid? VariantId);
