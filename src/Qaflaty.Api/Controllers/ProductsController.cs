using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Catalog.Commands.CreateProduct;
using Qaflaty.Application.Catalog.Commands.DeleteProduct;
using Qaflaty.Application.Catalog.Commands.ActivateProduct;
using Qaflaty.Application.Catalog.Commands.DeactivateProduct;
using Qaflaty.Application.Catalog.Commands.UpdateProduct;
using Qaflaty.Application.Catalog.Queries.GetProductById;
using Qaflaty.Application.Catalog.Queries.GetProducts;

namespace Qaflaty.Api.Controllers;

[Route("api/stores/{storeId:guid}/products")]
[Authorize]
public class ProductsController : ApiController
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetProducts(
        Guid storeId,
        [FromQuery] string? searchTerm,
        [FromQuery] Guid? categoryId,
        [FromQuery] string? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new GetProductsQuery(storeId, searchTerm, categoryId, status, pageNumber, pageSize);
        var result = await Sender.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetProductById(Guid storeId, Guid id, CancellationToken cancellationToken)
    {
        var query = new GetProductByIdQuery(id);
        var result = await Sender.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateProduct(Guid storeId, [FromBody] CreateProductRequest request, CancellationToken cancellationToken)
    {
        var command = new CreateProductCommand(
            storeId,
            request.Name,
            request.Slug,
            request.Description,
            request.Price.Amount,
            request.CompareAtPrice?.Amount,
            request.Quantity,
            request.Sku,
            request.TrackInventory,
            request.CategoryId,
            request.Status);

        var result = await Sender.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return HandleResult(result);
        }

        return StatusCode(StatusCodes.Status201Created, result.Value);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateProduct(Guid storeId, Guid id, [FromBody] UpdateProductRequest request, CancellationToken cancellationToken)
    {
        var command = new UpdateProductCommand(
            id,
            request.Name,
            request.Slug,
            request.Description,
            request.Price.Amount,
            request.CompareAtPrice?.Amount,
            request.Quantity,
            request.Sku,
            request.TrackInventory,
            request.CategoryId,
            request.Status);

        var result = await Sender.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteProduct(Guid storeId, Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteProductCommand(id);
        var result = await Sender.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return HandleResult(result);
        }

        return NoContent();
    }

    [HttpPatch("{id:guid}/activate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ActivateProduct(Guid storeId, Guid id, CancellationToken cancellationToken)
    {
        var command = new ActivateProductCommand(id);
        var result = await Sender.Send(command, cancellationToken);

        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }

    [HttpPatch("{id:guid}/deactivate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeactivateProduct(Guid storeId, Guid id, CancellationToken cancellationToken)
    {
        var command = new DeactivateProductCommand(id);
        var result = await Sender.Send(command, cancellationToken);

        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }
}

public record MoneyInput(decimal Amount, string Currency = "SAR");

public record CreateProductRequest(
    string Name,
    string Slug,
    string? Description,
    MoneyInput Price,
    MoneyInput? CompareAtPrice,
    int Quantity,
    string? Sku,
    bool TrackInventory,
    Guid? CategoryId,
    string? Status);

public record UpdateProductRequest(
    string Name,
    string Slug,
    string? Description,
    MoneyInput Price,
    MoneyInput? CompareAtPrice,
    int Quantity,
    string? Sku,
    bool TrackInventory,
    Guid? CategoryId,
    string? Status);
