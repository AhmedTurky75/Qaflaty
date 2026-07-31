using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Storefront.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Queries.GetMyProductReview;

public class GetMyProductReviewQueryHandler : IQueryHandler<GetMyProductReviewQuery, ProductReviewDto?>
{
    private readonly IProductReviewRepository _reviewRepository;

    public GetMyProductReviewQueryHandler(IProductReviewRepository reviewRepository)
    {
        _reviewRepository = reviewRepository;
    }

    public async Task<Result<ProductReviewDto?>> Handle(GetMyProductReviewQuery request, CancellationToken ct)
    {
        var review = await _reviewRepository.GetByCustomerAndProductAsync(
            request.CustomerId, request.ProductId, ct);

        if (review is null)
            return Result.Success<ProductReviewDto?>(null);

        var dto = new ProductReviewDto(
            Id: review.Id.Value,
            ProductId: review.ProductId.Value,
            CustomerName: review.CustomerName,
            Rating: review.Rating,
            Title: review.Title,
            Comment: review.Comment,
            IsVerifiedPurchase: review.IsVerifiedPurchase,
            IsPinned: review.IsPinned,
            HelpfulCount: review.HelpfulCount,
            CreatedAt: review.CreatedAt.ToString("O"),
            Media: review.Media
                .OrderBy(m => m.SortOrder)
                .Select(m => new ProductReviewMediaDto(m.Url, m.Type.ToString(), m.SortOrder))
                .ToList());

        return Result.Success<ProductReviewDto?>(dto);
    }
}
