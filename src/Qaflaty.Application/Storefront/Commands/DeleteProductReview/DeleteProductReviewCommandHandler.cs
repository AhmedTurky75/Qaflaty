using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Storefront.Errors;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Commands.DeleteProductReview;

public class DeleteProductReviewCommandHandler : ICommandHandler<DeleteProductReviewCommand>
{
    private readonly IProductReviewRepository _reviewRepository;

    public DeleteProductReviewCommandHandler(IProductReviewRepository reviewRepository)
    {
        _reviewRepository = reviewRepository;
    }

    public async Task<Result> Handle(DeleteProductReviewCommand request, CancellationToken ct)
    {
        var review = await _reviewRepository.GetByIdAsync(request.ReviewId, ct);
        if (review is null)
            return Result.Failure(ReviewErrors.NotFound);

        if (review.CustomerId != request.CustomerId)
            return Result.Failure(ReviewErrors.NotOwner);

        _reviewRepository.Delete(review);
        return Result.Success();
    }
}
