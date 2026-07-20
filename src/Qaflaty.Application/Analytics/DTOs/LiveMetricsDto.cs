namespace Qaflaty.Application.Analytics.DTOs;

/// <summary>Raw per-product viewer count as tracked by <see cref="Abstractions.IPresenceTracker"/> — no product data, cheap to compute in the sweeper.</summary>
public record ProductViewerCountDto(Guid ProductId, int ViewerCount);

/// <summary>Product-enriched viewer count for the merchant dashboard (mirrors <c>MostWishlistedProductDto</c>'s enrichment pattern).</summary>
public record LiveProductViewerDto(
    Guid ProductId,
    string ProductName,
    string ProductSlug,
    string? ImageUrl,
    int ViewerCount);

public record LiveMetricsDto(
    int ActiveUsers,
    int ActiveCartCount,
    List<LiveProductViewerDto> ProductViewers);
