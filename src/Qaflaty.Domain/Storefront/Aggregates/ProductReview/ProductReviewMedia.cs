using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Storefront.Enums;

namespace Qaflaty.Domain.Storefront.Aggregates.ProductReview;

public sealed class ProductReviewMedia : Entity<Guid>
{
    public ProductReviewId ReviewId { get; private set; }
    public string Url { get; private set; } = null!;
    public ReviewMediaType Type { get; private set; }
    public int SortOrder { get; private set; }

    private ProductReviewMedia() : base(Guid.Empty) { }

    public static ProductReviewMedia Create(ProductReviewId reviewId, string url, ReviewMediaType type, int sortOrder)
    {
        return new ProductReviewMedia
        {
            Id = Guid.NewGuid(),
            ReviewId = reviewId,
            Url = url,
            Type = type,
            SortOrder = sortOrder
        };
    }
}
