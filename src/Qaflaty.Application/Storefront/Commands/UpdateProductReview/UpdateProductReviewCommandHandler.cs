using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Storefront.Errors;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Commands.UpdateProductReview;

public class UpdateProductReviewCommandHandler : ICommandHandler<UpdateProductReviewCommand>
{
    private readonly IProductReviewRepository _reviewRepository;
    private readonly IStoreConfigurationRepository _storeConfigRepository;

    public UpdateProductReviewCommandHandler(
        IProductReviewRepository reviewRepository,
        IStoreConfigurationRepository storeConfigRepository)
    {
        _reviewRepository = reviewRepository;
        _storeConfigRepository = storeConfigRepository;
    }

    public async Task<Result> Handle(UpdateProductReviewCommand request, CancellationToken ct)
    {
        var review = await _reviewRepository.GetByIdAsync(request.ReviewId, ct);
        if (review is null)
            return Result.Failure(ReviewErrors.NotFound);

        if (review.CustomerId != request.CustomerId)
            return Result.Failure(ReviewErrors.NotOwner);

        var config = await _storeConfigRepository.GetByStoreIdAsync(review.StoreId, ct);
        if (config is null || !config.FeatureToggles.Reviews)
            return Result.Failure(ReviewErrors.ReviewsDisabled);

        if (!config.ReviewsAllowEditing)
            return Result.Failure(ReviewErrors.EditingDisabled);

        var result = review.UpdateContent(request.Rating, request.Title, request.Comment, config.ReviewsAutoApprove);
        if (result.IsFailure)
            return result;

        _reviewRepository.Update(review);
        return Result.Success();
    }
}
