using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Storefront.Enums;
using Qaflaty.Domain.Storefront.Errors;

namespace Qaflaty.Domain.Storefront.Aggregates.ProductReview;

/// <summary>
/// A customer's review of a product. Always carries a 1-5 star rating and an
/// optional title/comment, so a "rating" is simply a review with no text.
/// Verified-purchase reviews are linked to a delivered order.
/// </summary>
public sealed class ProductReview : AggregateRoot<ProductReviewId>
{
    public const int MaxCommentLength = 4000;
    public const int MaxTitleLength = 200;

    public StoreId StoreId { get; private set; }
    public ProductId ProductId { get; private set; }
    public StoreCustomerId CustomerId { get; private set; }
    public string CustomerName { get; private set; } = null!;
    public OrderId? OrderId { get; private set; }
    public int Rating { get; private set; }
    public string? Title { get; private set; }
    public string? Comment { get; private set; }
    public ReviewStatus Status { get; private set; }
    public bool IsVerifiedPurchase { get; private set; }
    public bool IsPinned { get; private set; }
    public int HelpfulCount { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }
    public DateTime? ApprovedAt { get; private set; }

    private readonly List<ProductReviewMedia> _media = [];
    public IReadOnlyList<ProductReviewMedia> Media => _media.AsReadOnly();

    private ProductReview() : base(ProductReviewId.Empty) { }

    public static Result<ProductReview> Create(
        StoreId storeId,
        ProductId productId,
        StoreCustomerId customerId,
        string customerName,
        int rating,
        string? title,
        string? comment,
        OrderId? verifiedOrderId,
        bool autoApprove)
    {
        if (rating is < 1 or > 5)
            return Result.Failure<ProductReview>(ReviewErrors.InvalidRating);

        if (comment is { Length: > MaxCommentLength })
            return Result.Failure<ProductReview>(ReviewErrors.CommentTooLong);

        var now = DateTime.UtcNow;
        var review = new ProductReview
        {
            Id = ProductReviewId.New(),
            StoreId = storeId,
            ProductId = productId,
            CustomerId = customerId,
            CustomerName = customerName,
            OrderId = verifiedOrderId,
            Rating = rating,
            Title = Trim(title, MaxTitleLength),
            Comment = comment,
            Status = autoApprove ? ReviewStatus.Approved : ReviewStatus.Pending,
            IsVerifiedPurchase = verifiedOrderId is not null,
            IsPinned = false,
            HelpfulCount = 0,
            CreatedAt = now,
            UpdatedAt = now,
            ApprovedAt = autoApprove ? now : null
        };

        return Result.Success(review);
    }

    public Result UpdateContent(int rating, string? title, string? comment, bool autoApprove)
    {
        if (rating is < 1 or > 5)
            return Result.Failure(ReviewErrors.InvalidRating);

        if (comment is { Length: > MaxCommentLength })
            return Result.Failure(ReviewErrors.CommentTooLong);

        Rating = rating;
        Title = Trim(title, MaxTitleLength);
        Comment = comment;
        UpdatedAt = DateTime.UtcNow;

        // An edited review re-enters moderation unless the store auto-approves.
        if (Status == ReviewStatus.Approved && !autoApprove)
        {
            Status = ReviewStatus.Pending;
            ApprovedAt = null;
        }

        return Result.Success();
    }

    public Result AddMedia(string url, ReviewMediaType type)
    {
        _media.Add(ProductReviewMedia.Create(Id, url, type, _media.Count));
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public void ClearMedia() => _media.Clear();

    public Result Approve()
    {
        Status = ReviewStatus.Approved;
        ApprovedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result Reject()
    {
        Status = ReviewStatus.Rejected;
        ApprovedAt = null;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result Hide()
    {
        Status = ReviewStatus.Hidden;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result SetPinned(bool pinned)
    {
        IsPinned = pinned;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public void IncrementHelpful()
    {
        HelpfulCount++;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>Whether this review should be visible to the public storefront.</summary>
    public bool IsPublic => Status == ReviewStatus.Approved;

    private static string? Trim(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        value = value.Trim();
        return value.Length > maxLength ? value[..maxLength] : value;
    }
}
