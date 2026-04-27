using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Catalog.Queries.GetPaymentMethodOptions;

namespace Qaflaty.Api.Controllers;

[Route("api/payment-methods")]
public class PaymentMethodsController : ApiController
{
    /// <summary>Returns all available payment method options with their default labels and descriptions.</summary>
    [HttpGet("options")]
    [AllowAnonymous]
    public async Task<IActionResult> GetOptions(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetPaymentMethodOptionsQuery(), cancellationToken);
        return HandleResult(result);
    }
}
