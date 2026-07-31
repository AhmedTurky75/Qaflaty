using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.ProductReview;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Commands.CreateManualReview;

public class CreateManualReviewCommandHandler : ICommandHandler<CreateManualReviewCommand, Guid>
{
    private readonly IProductReviewRepository _reviewRepository;

    public CreateManualReviewCommandHandler(IProductReviewRepository reviewRepository)
    {
        _reviewRepository = reviewRepository;
    }

    public async Task<Result<Guid>> Handle(CreateManualReviewCommand request, CancellationToken ct)
    {
        // Synthetic customer id keeps the unique (CustomerId, ProductId) index
        // satisfied for each seeded review; auto-approved so it shows immediately.
        var createResult = ProductReview.Create(
            new StoreId(request.StoreId),
            new ProductId(request.ProductId),
            StoreCustomerId.New(),
            request.AuthorName,
            request.Rating,
            request.Title,
            request.Comment,
            verifiedOrderId: null,
            autoApprove: true);

        if (createResult.IsFailure)
            return Result.Failure<Guid>(createResult.Error);

        await _reviewRepository.AddAsync(createResult.Value, ct);
        return Result.Success(createResult.Value.Id.Value);
    }
}
