using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Storefront.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Storefront.Aggregates.ProductReview;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Queries.GetProductReviews;

public class GetProductReviewsQueryHandler : IQueryHandler<GetProductReviewsQuery, ProductReviewListDto>
{
    private readonly IProductReviewRepository _reviewRepository;

    public GetProductReviewsQueryHandler(IProductReviewRepository reviewRepository)
    {
        _reviewRepository = reviewRepository;
    }

    public async Task<Result<ProductReviewListDto>> Handle(GetProductReviewsQuery request, CancellationToken ct)
    {
        // All approved reviews drive the summary; the page is sliced from the filtered/sorted set.
        var approved = await _reviewRepository.GetApprovedByProductIdAsync(request.ProductId, ct);

        var summary = BuildSummary(approved);

        IEnumerable<ProductReview> filtered = approved;
        if (request.FilterStars is >= 1 and <= 5)
            filtered = filtered.Where(r => r.Rating == request.FilterStars);

        filtered = request.SortBy switch
        {
            "helpful" => filtered.OrderByDescending(r => r.IsPinned).ThenByDescending(r => r.HelpfulCount).ThenByDescending(r => r.CreatedAt),
            "highest" => filtered.OrderByDescending(r => r.IsPinned).ThenByDescending(r => r.Rating).ThenByDescending(r => r.CreatedAt),
            "lowest" => filtered.OrderByDescending(r => r.IsPinned).ThenBy(r => r.Rating).ThenByDescending(r => r.CreatedAt),
            _ => filtered.OrderByDescending(r => r.IsPinned).ThenByDescending(r => r.CreatedAt)
        };

        var filteredList = filtered.ToList();
        var totalCount = filteredList.Count;
        var pageSize = request.PageSize <= 0 ? 10 : Math.Min(request.PageSize, 50);
        var page = request.Page <= 0 ? 1 : request.Page;
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = filteredList
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(MapToDto)
            .ToList();

        return Result.Success(new ProductReviewListDto(
            Summary: summary,
            Items: items,
            Page: page,
            PageSize: pageSize,
            TotalPages: totalPages,
            TotalCount: totalCount));
    }

    private static ReviewSummaryDto BuildSummary(IReadOnlyList<ProductReview> reviews)
    {
        var total = reviews.Count;
        var counts = new Dictionary<int, int> { [5] = 0, [4] = 0, [3] = 0, [2] = 0, [1] = 0 };
        foreach (var r in reviews)
            if (counts.ContainsKey(r.Rating))
                counts[r.Rating]++;

        var percentages = new Dictionary<int, int>();
        foreach (var star in counts.Keys)
            percentages[star] = total == 0 ? 0 : (int)Math.Round(counts[star] * 100.0 / total);

        var average = total == 0 ? 0 : Math.Round(reviews.Average(r => r.Rating), 1);
        var verified = reviews.Count(r => r.IsVerifiedPurchase);

        return new ReviewSummaryDto(average, total, verified, counts, percentages);
    }

    private static ProductReviewDto MapToDto(ProductReview r) => new(
        Id: r.Id.Value,
        ProductId: r.ProductId.Value,
        CustomerName: r.CustomerName,
        Rating: r.Rating,
        Title: r.Title,
        Comment: r.Comment,
        IsVerifiedPurchase: r.IsVerifiedPurchase,
        IsPinned: r.IsPinned,
        HelpfulCount: r.HelpfulCount,
        CreatedAt: r.CreatedAt.ToString("O"),
        Media: r.Media
            .OrderBy(m => m.SortOrder)
            .Select(m => new ProductReviewMediaDto(m.Url, m.Type.ToString(), m.SortOrder))
            .ToList());
}
