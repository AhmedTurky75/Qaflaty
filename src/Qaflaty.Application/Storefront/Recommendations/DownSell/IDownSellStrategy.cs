using Qaflaty.Domain.Catalog.Aggregates.Product;

namespace Qaflaty.Application.Storefront.Recommendations.DownSell;

/// <summary>
/// One source of downsell candidates (manual merchant links, category + lower-price affinity, ...).
/// <see cref="CompositeDownSellStrategy"/> runs strategies in <see cref="Priority"/> order until
/// enough eligible candidates are found, so a new strategy (AI-powered, inventory-aware, ...) can
/// be registered without touching any caller.
/// </summary>
internal interface IDownSellStrategy
{
    /// <summary>Lower numbers run first.</summary>
    int Priority { get; }

    Task<IReadOnlyList<Guid>> RecommendAsync(Product source, RecommendationCandidatePool pool, CancellationToken ct);
}
