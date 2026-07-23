using Qaflaty.Domain.Catalog.Aggregates.Product;

namespace Qaflaty.Application.Storefront.Recommendations.UpSell;

/// <summary>
/// One source of upsell candidates (manual merchant links, category + higher-price affinity, ...).
/// <see cref="CompositeUpSellStrategy"/> runs strategies in <see cref="Priority"/> order until
/// enough eligible candidates are found, so a new strategy (AI-powered, margin-based, best-selling
/// premium, ...) can be registered without touching any caller.
/// </summary>
internal interface IUpSellStrategy
{
    /// <summary>Lower numbers run first.</summary>
    int Priority { get; }

    Task<IReadOnlyList<Guid>> RecommendAsync(Product source, RecommendationCandidatePool pool, CancellationToken ct);
}
