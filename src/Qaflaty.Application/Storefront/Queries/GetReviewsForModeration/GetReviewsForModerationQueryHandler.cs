using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Storefront.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Storefront.Enums;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Queries.GetReviewsForModeration;

public class GetReviewsForModerationQueryHandler
    : IQueryHandler<GetReviewsForModerationQuery, IReadOnlyList<ReviewModerationDto>>
{
    private readonly IProductReviewRepository _reviewRepository;

    public GetReviewsForModerationQueryHandler(IProductReviewRepository reviewRepository)
    {
        _reviewRepository = reviewRepository;
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

        var dtos = reviews.Select(r => new ReviewModerationDto(
            Id: r.Id.Value,
            ProductId: r.ProductId.Value,
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
                .ToList()))
            .ToList();

        return Result.Success<IReadOnlyList<ReviewModerationDto>>(dtos);
    }
}
