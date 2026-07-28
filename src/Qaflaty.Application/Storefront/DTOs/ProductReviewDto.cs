namespace Qaflaty.Application.Storefront.DTOs;

public record ProductReviewMediaDto(
    string Url,
    string Type,
    int SortOrder);

public record ProductReviewDto(
    Guid Id,
    Guid ProductId,
    string CustomerName,
    int Rating,
    string? Title,
    string? Comment,
    bool IsVerifiedPurchase,
    bool IsPinned,
    int HelpfulCount,
    string CreatedAt,
    IReadOnlyList<ProductReviewMediaDto> Media);

/// <summary>Aggregated rating statistics for a product.</summary>
public record ReviewSummaryDto(
    double AverageRating,
    int TotalReviews,
    int TotalVerified,
    // Percentage (0-100) of reviews at each star level, index 0 = 5★ ... index 4 = 1★
    IReadOnlyDictionary<int, int> DistributionCounts,
    IReadOnlyDictionary<int, int> DistributionPercentages);

public record ProductReviewListDto(
    ReviewSummaryDto Summary,
    IReadOnlyList<ProductReviewDto> Items,
    int Page,
    int PageSize,
    int TotalPages,
    int TotalCount);

/// <summary>Merchant-side view including moderation status.</summary>
public record ReviewModerationDto(
    Guid Id,
    Guid ProductId,
    // Product identity for the moderation list — a merchant reviewing a queue needs to see what the
    // review is about without opening each product. Null when the product has since been deleted.
    string? ProductName,
    string? ProductNameAr,
    string? ProductSlug,
    string? ProductImageUrl,
    string CustomerName,
    int Rating,
    string? Title,
    string? Comment,
    string Status,
    bool IsVerifiedPurchase,
    bool IsPinned,
    int HelpfulCount,
    string CreatedAt,
    IReadOnlyList<ProductReviewMediaDto> Media);

public record ReviewSettingsDto(
    bool ReviewsEnabled,
    bool RequirePurchase,
    bool AutoApprove,
    bool AllowEditing);
