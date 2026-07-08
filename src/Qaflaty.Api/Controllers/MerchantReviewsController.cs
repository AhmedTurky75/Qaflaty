using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Storefront.Commands.CreateManualReview;
using Qaflaty.Application.Storefront.Commands.ModerateProductReview;
using Qaflaty.Application.Storefront.Commands.UpdateReviewSettings;
using Qaflaty.Application.Storefront.Queries.GetReviewSettings;
using Qaflaty.Application.Storefront.Queries.GetReviewsForModeration;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Api.Controllers;

[Route("api/stores/{storeId:guid}/reviews")]
[Authorize]
public class MerchantReviewsController : ApiController
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetReviews(
        Guid storeId,
        [FromQuery] Guid? productId,
        [FromQuery] string? status,
        CancellationToken ct)
    {
        var query = new GetReviewsForModerationQuery(
            new StoreId(storeId),
            productId.HasValue ? new ProductId(productId.Value) : null,
            status);
        var result = await Sender.Send(query, ct);
        return HandleResult(result);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateManualReview(
        Guid storeId, [FromBody] CreateManualReviewRequest request, CancellationToken ct)
    {
        var command = new CreateManualReviewCommand(
            storeId, request.ProductId, request.AuthorName, request.Rating, request.Title, request.Comment);
        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }

    [HttpPost("{reviewId:guid}/approve")]
    public Task<IActionResult> Approve(Guid storeId, Guid reviewId, CancellationToken ct)
        => Moderate(storeId, reviewId, ReviewModerationAction.Approve, ct);

    [HttpPost("{reviewId:guid}/reject")]
    public Task<IActionResult> Reject(Guid storeId, Guid reviewId, CancellationToken ct)
        => Moderate(storeId, reviewId, ReviewModerationAction.Reject, ct);

    [HttpPost("{reviewId:guid}/hide")]
    public Task<IActionResult> Hide(Guid storeId, Guid reviewId, CancellationToken ct)
        => Moderate(storeId, reviewId, ReviewModerationAction.Hide, ct);

    [HttpPost("{reviewId:guid}/pin")]
    public Task<IActionResult> Pin(Guid storeId, Guid reviewId, CancellationToken ct)
        => Moderate(storeId, reviewId, ReviewModerationAction.Pin, ct);

    [HttpPost("{reviewId:guid}/unpin")]
    public Task<IActionResult> Unpin(Guid storeId, Guid reviewId, CancellationToken ct)
        => Moderate(storeId, reviewId, ReviewModerationAction.Unpin, ct);

    [HttpGet("settings")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSettings(Guid storeId, CancellationToken ct)
    {
        var result = await Sender.Send(new GetReviewSettingsQuery(new StoreId(storeId)), ct);
        return HandleResult(result);
    }

    [HttpPut("settings")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateSettings(
        Guid storeId, [FromBody] UpdateReviewSettingsRequest request, CancellationToken ct)
    {
        var command = new UpdateReviewSettingsCommand(
            new StoreId(storeId),
            request.ReviewsEnabled,
            request.RequirePurchase,
            request.AutoApprove,
            request.AllowEditing);

        var result = await Sender.Send(command, ct);
        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }

    private async Task<IActionResult> Moderate(
        Guid storeId, Guid reviewId, ReviewModerationAction action, CancellationToken ct)
    {
        var command = new ModerateProductReviewCommand(
            new ProductReviewId(reviewId), new StoreId(storeId), action);
        var result = await Sender.Send(command, ct);
        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }
}

public record UpdateReviewSettingsRequest(
    bool ReviewsEnabled, bool RequirePurchase, bool AutoApprove, bool AllowEditing);

public record CreateManualReviewRequest(
    Guid ProductId, string AuthorName, int Rating, string? Title, string? Comment);
