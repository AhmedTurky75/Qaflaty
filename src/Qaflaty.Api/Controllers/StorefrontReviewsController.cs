using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Storefront.Commands.DeleteProductReview;
using Qaflaty.Application.Storefront.Commands.SubmitProductReview;
using Qaflaty.Application.Storefront.Commands.UpdateProductReview;
using Qaflaty.Application.Storefront.Commands.VoteReviewHelpful;
using Qaflaty.Application.Storefront.Queries.GetMyProductReview;
using Qaflaty.Application.Storefront.Queries.GetProductReviews;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Api.Controllers;

[ApiController]
[Route("api/storefront")]
public class StorefrontReviewsController : ApiController
{
    private readonly ITenantContext _tenantContext;

    public StorefrontReviewsController(ITenantContext tenantContext)
    {
        _tenantContext = tenantContext;
    }

    [HttpGet("products/{productId:guid}/reviews")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProductReviews(
        Guid productId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? sortBy = null,
        [FromQuery] int? stars = null,
        CancellationToken ct = default)
    {
        var query = new GetProductReviewsQuery(new ProductId(productId), page, pageSize, sortBy, stars);
        var result = await Sender.Send(query, ct);
        return HandleResult(result);
    }

    [HttpGet("products/{productId:guid}/reviews/mine")]
    [Authorize(Policy = "CustomerPolicy")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyReview(Guid productId, CancellationToken ct)
    {
        var customerId = CurrentUserService.CustomerId;
        if (customerId == null)
            return Unauthorized();

        var query = new GetMyProductReviewQuery(customerId.Value, new ProductId(productId));
        var result = await Sender.Send(query, ct);
        return HandleResult(result);
    }

    [HttpPost("products/{productId:guid}/reviews")]
    [Authorize(Policy = "CustomerPolicy")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SubmitReview(
        Guid productId, [FromBody] SubmitReviewRequest request, CancellationToken ct)
    {
        var customerId = CurrentUserService.CustomerId;
        if (customerId == null)
            return Unauthorized();

        if (!_tenantContext.IsResolved || _tenantContext.CurrentStoreId == null)
            return NotFound(new { error = "Store.NotResolved", message = "Store context not resolved" });

        var command = new SubmitProductReviewCommand(
            StoreId: _tenantContext.CurrentStoreId.Value,
            ProductId: new ProductId(productId),
            CustomerId: customerId.Value,
            Rating: request.Rating,
            Title: request.Title,
            Comment: request.Comment,
            Media: request.Media?.Select(m => new ReviewMediaInput(m.Url, m.Type)).ToList());

        var result = await Sender.Send(command, ct);
        if (result.IsFailure)
            return HandleResult(result);

        return Created(string.Empty, new { id = result.Value });
    }

    [HttpPut("reviews/{reviewId:guid}")]
    [Authorize(Policy = "CustomerPolicy")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateReview(
        Guid reviewId, [FromBody] UpdateReviewRequest request, CancellationToken ct)
    {
        var customerId = CurrentUserService.CustomerId;
        if (customerId == null)
            return Unauthorized();

        var command = new UpdateProductReviewCommand(
            new ProductReviewId(reviewId),
            customerId.Value,
            request.Rating,
            request.Title,
            request.Comment);

        var result = await Sender.Send(command, ct);
        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }

    [HttpDelete("reviews/{reviewId:guid}")]
    [Authorize(Policy = "CustomerPolicy")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteReview(Guid reviewId, CancellationToken ct)
    {
        var customerId = CurrentUserService.CustomerId;
        if (customerId == null)
            return Unauthorized();

        var command = new DeleteProductReviewCommand(new ProductReviewId(reviewId), customerId.Value);
        var result = await Sender.Send(command, ct);
        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }

    [HttpPost("reviews/{reviewId:guid}/helpful")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> VoteHelpful(Guid reviewId, CancellationToken ct)
    {
        var command = new VoteReviewHelpfulCommand(new ProductReviewId(reviewId));
        var result = await Sender.Send(command, ct);
        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }
}

public record ReviewMediaRequest(string Url, string Type);
public record SubmitReviewRequest(int Rating, string? Title, string? Comment, List<ReviewMediaRequest>? Media);
public record UpdateReviewRequest(int Rating, string? Title, string? Comment);
