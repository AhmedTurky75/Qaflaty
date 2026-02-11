using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Catalog.Commands.CreateCategory;
using Qaflaty.Application.Catalog.Commands.DeleteCategory;
using Qaflaty.Application.Catalog.Commands.ReorderCategories;
using Qaflaty.Application.Catalog.Commands.UpdateCategory;
using Qaflaty.Application.Catalog.Queries.GetCategories;
using Qaflaty.Application.Catalog.Queries.GetCategoryTree;

namespace Qaflaty.Api.Controllers;

[Route("api/stores/{storeId:guid}/categories")]
[Authorize]
public class CategoriesController : ApiController
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCategories(Guid storeId, CancellationToken cancellationToken)
    {
        var query = new GetCategoriesQuery(storeId);
        var result = await Sender.Send(query, cancellationToken);
        return HandleResult(result);
    }

    [HttpGet("tree")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCategoryTree(Guid storeId, CancellationToken cancellationToken)
    {
        var query = new GetCategoryTreeQuery(storeId);
        var result = await Sender.Send(query, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateCategory(Guid storeId, [FromBody] CreateCategoryRequest request, CancellationToken cancellationToken)
    {
        var command = new CreateCategoryCommand(
            storeId,
            request.Name,
            request.Slug,
            request.ParentId,
            request.SortOrder);

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
    public async Task<IActionResult> UpdateCategory(Guid storeId, Guid id, [FromBody] UpdateCategoryRequest request, CancellationToken cancellationToken)
    {
        var command = new UpdateCategoryCommand(id, request.Name, request.ParentId);
        var result = await Sender.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteCategory(Guid storeId, Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteCategoryCommand(id);
        var result = await Sender.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return HandleResult(result);
        }

        return NoContent();
    }

    [HttpPut("reorder")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ReorderCategories(Guid storeId, [FromBody] ReorderCategoriesRequest request, CancellationToken cancellationToken)
    {
        var items = request.Items.Select(i => new CategoryOrderItem(i.CategoryId, i.SortOrder)).ToList();
        var command = new ReorderCategoriesCommand(storeId, items);
        var result = await Sender.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return HandleResult(result);
        }

        return NoContent();
    }
}

public record CreateCategoryRequest(
    string Name,
    string Slug,
    Guid? ParentId,
    int SortOrder = 0);

public record UpdateCategoryRequest(string Name, Guid? ParentId);

public record ReorderCategoriesRequest(List<CategoryOrderItemRequest> Items);

public record CategoryOrderItemRequest(Guid CategoryId, int SortOrder);
