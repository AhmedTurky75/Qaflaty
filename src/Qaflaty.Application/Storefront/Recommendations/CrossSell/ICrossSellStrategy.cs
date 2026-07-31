using Qaflaty.Domain.Catalog.Aggregates.Product;

namespace Qaflaty.Application.Storefront.Recommendations.CrossSell;

/// <summary>
/// One source of cross-sell candidates (manual merchant links, order-history co-occurrence,
/// category affinity, ...). <see cref="CompositeCrossSellStrategy"/> runs strategies in
/// <see cref="Priority"/> order until enough eligible candidates are found, so a new strategy
/// (AI-powered, best-selling, personalized, ...) can be registered without touching any caller.
/// </summary>
internal interface ICrossSellStrategy
{
    /// <summary>Lower numbers run first.</summary>
    int Priority { get; }

    /// <summary>
    /// Returns candidate product ids for <paramref name="source"/>, ranked best-first.
    /// Implementations do not need to apply eligibility filtering (active/in-stock/dedupe) —
    /// the composite applies <see cref="RecommendationEligibilityPolicy"/> once, after merging.
    /// </summary>
    Task<IReadOnlyList<Guid>> RecommendAsync(Product source, RecommendationCandidatePool pool, CancellationToken ct);
}
