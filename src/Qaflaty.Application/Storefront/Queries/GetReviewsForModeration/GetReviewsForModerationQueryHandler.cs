using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Storefront.DTOs;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Storefront.Enums;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Queries.GetReviewsForModeration;

public class GetReviewsForModerationQueryHandler
    : IQueryHandler<GetReviewsForModerationQuery, IReadOnlyList<ReviewModerationDto>>
{
    private readonly IProductReviewRepository _reviewRepository;
    private readonly IProductRepository _productRepository;

    public GetReviewsForModerationQueryHandler(
        IProductReviewRepository reviewRepository,
        IProductRepository productRepository)
    {
        _reviewRepository = reviewRepository;
        _productRepository = productRepository;
    }

    public async Task<Result<IReadOnlyList<ReviewModerationDto>>> Handle(
        GetReviewsForModerationQuery request, CancellationToken ct)
    {
        ReviewStatus? status = null;
        if (!string.IsNullOrWhiteSpace(request.Status)
            && Enum.TryParse<ReviewStatus>(request.Status, ignoreCase: true, out var parsed))
        {
            status = parsed;
        }

        var reviews = await _reviewRepository.GetForModerationAsync(request.StoreId, request.ProductId, status, ct);

        // One fetch for the store, keyed by product id, so the moderation list can show what each
        // review is about without a per-review lookup.
        var products = await _productRepository.GetByStoreIdAsync(request.StoreId, ct);
        var productLookup = products.ToDictionary(p => p.Id.Value);

        var dtos = reviews.Select(r =>
        {
            var product = productLookup.GetValueOrDefault(r.ProductId.Value);

            return new ReviewModerationDto(
            Id: r.Id.Value,
            ProductId: r.ProductId.Value,
            ProductName: product?.Name.English,
            ProductNameAr: product?.Name.Arabic,
            ProductSlug: product?.Slug.Value,
            // Primary image is the lowest sort order; the gallery is not stored pre-sorted.
            ProductImageUrl: product?.Images.OrderBy(i => i.SortOrder).FirstOrDefault()?.Url,
            CustomerName: r.CustomerName,
            Rating: r.Rating,
            Title: r.Title,
            Comment: r.Comment,
            Status: r.Status.ToString(),
            IsVerifiedPurchase: r.IsVerifiedPurchase,
            IsPinned: r.IsPinned,
            HelpfulCount: r.HelpfulCount,
            CreatedAt: r.CreatedAt.ToString("O"),
            Media: r.Media
                .OrderBy(m => m.SortOrder)
                .Select(m => new ProductReviewMediaDto(m.Url, m.Type.ToString(), m.SortOrder))
                .ToList());
        })
            .ToList();

        return Result.Success<IReadOnlyList<ReviewModerationDto>>(dtos);
    }
}
