using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Storefront.Enums;

namespace Qaflaty.Domain.Storefront.Aggregates.ProductReview;

public sealed class ProductReviewMedia : Entity<Guid>
{
    public ProductReviewId ReviewId { get; private set; } // Parent review this media belongs to
    public string Url { get; private set; } = null!; // Public URL of the uploaded image/video
    public ReviewMediaType Type { get; private set; } // Whether the media is an Image or a Video
    public int SortOrder { get; private set; } // Display order of the media within the review (lower = first)

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
