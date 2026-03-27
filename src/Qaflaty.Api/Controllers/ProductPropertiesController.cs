using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Catalog.Commands.CreateProductPropertyDefinition;
using Qaflaty.Application.Catalog.Commands.DeleteProductPropertyDefinition;
using Qaflaty.Application.Catalog.Commands.SetProductPropertyValues;
using Qaflaty.Application.Catalog.Commands.UpdateProductPropertyDefinition;
using Qaflaty.Application.Catalog.Queries.GetProductPropertyDefinitions;

namespace Qaflaty.Api.Controllers;

[Route("api/stores/{storeId:guid}/product-properties")]
[Authorize]
public class ProductPropertiesController : ApiController
{
    [HttpGet]
    public async Task<IActionResult> GetDefinitions(Guid storeId, CancellationToken ct)
    {
        var result = await Sender.Send(new GetProductPropertyDefinitionsQuery(storeId), ct);
        return HandleResult(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateDefinition(
        Guid storeId, [FromBody] CreateProductPropertyDefinitionRequest request, CancellationToken ct)
    {
        var command = new CreateProductPropertyDefinitionCommand(
            storeId, request.Name, request.DisplayName, request.Type,
            request.Options, request.IsRequired, request.IsFilterable, request.SortOrder);

        var result = await Sender.Send(command, ct);
        if (result.IsFailure) return HandleResult(result);
        return CreatedAtAction(nameof(GetDefinitions), new { storeId }, result.Value);
    }

    [HttpPut("{definitionId:guid}")]
    public async Task<IActionResult> UpdateDefinition(
        Guid storeId, Guid definitionId, [FromBody] UpdateProductPropertyDefinitionRequest request, CancellationToken ct)
    {
        var command = new UpdateProductPropertyDefinitionCommand(
            definitionId, request.DisplayName, request.Options,
            request.IsRequired, request.IsFilterable, request.SortOrder);

        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }

    [HttpDelete("{definitionId:guid}")]
    public async Task<IActionResult> DeleteDefinition(Guid storeId, Guid definitionId, CancellationToken ct)
    {
        var result = await Sender.Send(new DeleteProductPropertyDefinitionCommand(definitionId), ct);
        return HandleResult(result);
    }

    [HttpPut("/api/products/{productId:guid}/properties")]
    public async Task<IActionResult> SetProductPropertyValues(
        Guid storeId, Guid productId, [FromBody] List<ProductPropertyValueRequest> values, CancellationToken ct)
    {
        var command = new SetProductPropertyValuesCommand(productId, values);
        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }
}

public record CreateProductPropertyDefinitionRequest(
    string Name,
    string DisplayName,
    string Type,
    List<string>? Options,
    bool IsRequired,
    bool IsFilterable,
    int SortOrder);

public record UpdateProductPropertyDefinitionRequest(
    string DisplayName,
    List<string>? Options,
    bool IsRequired,
    bool IsFilterable,
    int SortOrder);
