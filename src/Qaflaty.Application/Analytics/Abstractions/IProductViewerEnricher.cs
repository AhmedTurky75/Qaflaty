using Qaflaty.Application.Analytics.DTOs;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Analytics.Abstractions;

/// <summary>
/// Turns the presence tracker's raw (productId, viewerCount) pairs into product-enriched viewer
/// rows (name / slug / image). Shared by the live-metrics query (initial snapshot) and the
/// presence sweeper (live push) so the enrichment logic lives in exactly one place. Scoped — it
/// reads the product catalog via the DbContext.
/// </summary>
public interface IProductViewerEnricher
{
    Task<List<LiveProductViewerDto>> EnrichAsync(
        StoreId storeId, IReadOnlyList<ProductViewerCountDto> rawCounts, CancellationToken ct = default);
}
