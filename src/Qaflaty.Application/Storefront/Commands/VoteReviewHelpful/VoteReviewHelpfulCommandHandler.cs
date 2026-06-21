using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Storefront.Errors;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Commands.VoteReviewHelpful;

public class VoteReviewHelpfulCommandHandler : ICommandHandler<VoteReviewHelpfulCommand>
{
    private readonly IProductReviewRepository _reviewRepository;

    public VoteReviewHelpfulCommandHandler(IProductReviewRepository reviewRepository)
    {
        _reviewRepository = reviewRepository;
    }

    public async Task<Result> Handle(VoteReviewHelpfulCommand request, CancellationToken ct)
    {
        var review = await _reviewRepository.GetByIdAsync(request.ReviewId, ct);
        if (review is null)
            return Result.Failure(ReviewErrors.NotFound);

        review.IncrementHelpful();
        _reviewRepository.Update(review);
        return Result.Success();
    }
}
