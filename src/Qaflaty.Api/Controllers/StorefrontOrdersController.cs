using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Api.Controllers.Requests;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Ordering.Commands.PlaceOrder;
using Qaflaty.Application.Ordering.Queries.TrackOrder;

namespace Qaflaty.Api.Controllers;

[ApiController]
[Route("api/storefront/orders")]
public class StorefrontOrdersController : ApiController
{
    private readonly ITenantContext _tenantContext;

    public StorefrontOrdersController(ITenantContext tenantContext)
    {
        _tenantContext = tenantContext;
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PlaceOrder([FromBody] PlaceOrderRequest request, CancellationToken ct)
    {
        if (!_tenantContext.IsResolved || _tenantContext.CurrentStoreId == null)
            return NotFound(new { error = "Store.NotResolved", message = "Store context not resolved" });

        var command = new PlaceOrderCommand(
            StoreId: _tenantContext.CurrentStoreId.Value.Value,
            CustomerName: request.CustomerName,
            CustomerPhone: request.CustomerPhone,
            CustomerEmail: request.CustomerEmail,
            Street: request.DeliveryAddress.Street,
            City: request.DeliveryAddress.City,
            District: request.DeliveryAddress.District,
            PostalCode: request.DeliveryAddress.PostalCode,
            Country: request.DeliveryAddress.Country,
            DeliveryInstructions: request.DeliveryInstructions,
            CustomerNotes: request.CustomerNotes,
            PaymentMethod: request.PaymentMethod,
            Items: request.Items.Select(item => new PlaceOrderItemDto(
                item.ProductId, item.ProductName, item.UnitPrice, item.Quantity)).ToList());

        var result = await Sender.Send(command, ct);

        if (result.IsSuccess)
            return CreatedAtAction(nameof(TrackOrder),
                new { orderNumber = result.Value.OrderNumber }, result.Value);

        return HandleResult(result);
    }

    [HttpGet("track/{orderNumber}")]
    public async Task<IActionResult> TrackOrder(string orderNumber, CancellationToken ct)
    {
        if (!_tenantContext.IsResolved || _tenantContext.CurrentStoreId == null)
            return NotFound(new { error = "Store.NotResolved", message = "Store context not resolved" });

        var result = await Sender.Send(
            new TrackOrderQuery(_tenantContext.CurrentStoreId.Value.Value, orderNumber), ct);
        return HandleResult(result);
    }
}
