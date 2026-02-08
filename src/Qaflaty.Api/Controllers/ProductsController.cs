using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Catalog.Commands.CreateProduct;
using Qaflaty.Application.Catalog.Commands.DeleteProduct;
using Qaflaty.Application.Catalog.Commands.ToggleProductStatus;
using Qaflaty.Application.Catalog.Commands.UpdateProduct;
using Qaflaty.Application.Catalog.Commands.UpdateProductInventory;
using Qaflaty.Application.Catalog.Commands.UpdateProductPricing;
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
            request.Price,
            request.CompareAtPrice,
            request.Quantity,
            request.Sku,
            request.TrackInventory,
            request.CategoryId);

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
        var command = new UpdateProductCommand(id, request.Name, request.Slug, request.Description, request.CategoryId);
        var result = await Sender.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpPut("{id:guid}/pricing")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateProductPricing(Guid storeId, Guid id, [FromBody] UpdateProductPricingRequest request, CancellationToken cancellationToken)
    {
        var command = new UpdateProductPricingCommand(id, request.Price, request.CompareAtPrice);
        var result = await Sender.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return HandleResult(result);
        }

        return NoContent();
    }

    [HttpPut("{id:guid}/inventory")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateProductInventory(Guid storeId, Guid id, [FromBody] UpdateProductInventoryRequest request, CancellationToken cancellationToken)
    {
        var command = new UpdateProductInventoryCommand(id, request.Quantity, request.Sku, request.TrackInventory);
        var result = await Sender.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return HandleResult(result);
        }

        return NoContent();
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

    [HttpPatch("{id:guid}/toggle-status")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ToggleProductStatus(Guid storeId, Guid id, CancellationToken cancellationToken)
    {
        var command = new ToggleProductStatusCommand(id);
        var result = await Sender.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return HandleResult(result);
        }

        return NoContent();
    }
}

public record CreateProductRequest(
    string Name,
    string Slug,
    string? Description,
    decimal Price,
    decimal? CompareAtPrice,
    int Quantity,
    string? Sku,
    bool TrackInventory,
    Guid? CategoryId);

public record UpdateProductRequest(
    string Name,
    string Slug,
    string? Description,
    Guid? CategoryId);

public record UpdateProductPricingRequest(
    decimal Price,
    decimal? CompareAtPrice);

public record UpdateProductInventoryRequest(
    int Quantity,
    string? Sku,
    bool TrackInventory);
