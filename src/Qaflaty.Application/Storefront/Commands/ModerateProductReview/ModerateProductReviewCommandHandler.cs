using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Storefront.Errors;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Commands.ModerateProductReview;

public class ModerateProductReviewCommandHandler : ICommandHandler<ModerateProductReviewCommand>
{
    private readonly IProductReviewRepository _reviewRepository;

    public ModerateProductReviewCommandHandler(IProductReviewRepository reviewRepository)
    {
        _reviewRepository = reviewRepository;
    }

    public async Task<Result> Handle(ModerateProductReviewCommand request, CancellationToken ct)
    {
        var review = await _reviewRepository.GetByIdAsync(request.ReviewId, ct);
        if (review is null)
            return Result.Failure(ReviewErrors.NotFound);

        // Tenant guard: a merchant can only moderate reviews belonging to their store.
        if (review.StoreId != request.StoreId)
            return Result.Failure(ReviewErrors.NotFound);

        var result = request.Action switch
        {
            ReviewModerationAction.Approve => review.Approve(),
            ReviewModerationAction.Reject => review.Reject(),
            ReviewModerationAction.Hide => review.Hide(),
            ReviewModerationAction.Pin => review.SetPinned(true),
            ReviewModerationAction.Unpin => review.SetPinned(false),
            _ => Result.Failure(ReviewErrors.NotFound)
        };

        if (result.IsFailure)
            return result;

        _reviewRepository.Update(review);
        return Result.Success();
    }
}
