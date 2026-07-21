namespace Qaflaty.Application.Analytics.DTOs;

/// <summary>
/// Raw per-product viewer count as tracked by <see cref="Abstractions.IPresenceTracker"/>. Keyed by
/// product <b>slug</b> — the storefront knows the slug from the page URL immediately (before the
/// product's data has even loaded), so a heartbeat can register the product view with no wait. The
/// slug→product resolution (name / image / id) happens later, only when a merchant reads the metrics.
/// </summary>
public record ProductViewerCountDto(string ProductSlug, int ViewerCount);

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
