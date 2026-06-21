using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Storefront.Queries.GetMostWishlisted;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Api.Controllers;

[Route("api/stores/{storeId:guid}/analytics")]
[Authorize]
public class MerchantAnalyticsController : ApiController
{
    [HttpGet("most-wishlisted")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMostWishlisted(
        Guid storeId, [FromQuery] int take = 10, CancellationToken ct = default)
    {
        var result = await Sender.Send(new GetMostWishlistedQuery(new StoreId(storeId), take), ct);
        return HandleResult(result);
    }
}
