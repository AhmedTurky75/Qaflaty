using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Catalog.Queries.GetLayoutVariants;

namespace Qaflaty.Api.Controllers;

/// <summary>
/// Global (non-tenant) catalog of storefront layout variants that the store builder presents in its
/// Header / Footer / Product Card / Product Grid dropdowns. Values returned here are the codes the
/// storefront renderer understands and that get saved on the store configuration.
/// </summary>
[Route("api/layout-variants")]
[Authorize]
public class LayoutVariantsController : ApiController
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await Sender.Send(new GetLayoutVariantsQuery(), ct);
        return HandleResult(result);
    }
}
