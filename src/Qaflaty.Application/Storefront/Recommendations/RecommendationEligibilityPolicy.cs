using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.Enums;

namespace Qaflaty.Application.Storefront.Recommendations;

/// <summary>
/// Single source of truth for which candidate products may ever be shown as a recommendation
/// (cross-sell, upsell, downsell, or generic related). Shared so every strategy enforces the
/// same rules instead of each handler re-implementing its own filter.
/// </summary>
internal static class RecommendationEligibilityPolicy
{
    /// <summary>
    /// True when <paramref name="candidate"/> may be recommended alongside <paramref name="sourceIds"/>.
    /// Tenant scoping is expected to already be enforced by the repository query (store_id filter).
    /// </summary>
    public static bool IsEligible(
        Product candidate,
        IReadOnlyCollection<Guid> sourceIds,
        IReadOnlyCollection<Guid> alreadyExcluded,
        bool excludeOutOfStock)
    {
        if (sourceIds.Contains(candidate.Id.Value))
            return false; // never recommend a product alongside itself

        if (alreadyExcluded.Contains(candidate.Id.Value))
            return false; // e.g. already in the cart

        if (candidate.Status != ProductStatus.Active)
            return false; // never inactive/unpublished

        if (excludeOutOfStock && !IsInStock(candidate))
            return false;

        return true;
    }

    /// <summary>Filters, de-duplicates (first occurrence wins) and caps a candidate list, preserving order.</summary>
    public static List<Product> Apply(
        IEnumerable<Product> candidates,
        IReadOnlyCollection<Guid> sourceIds,
        IReadOnlyCollection<Guid> alreadyExcluded,
        bool excludeOutOfStock,
        int take)
    {
        var seen = new HashSet<Guid>();
        var result = new List<Product>(take);

        foreach (var candidate in candidates)
        {
            if (result.Count >= take)
                break;

            if (!seen.Add(candidate.Id.Value))
                continue; // de-dupe across strategies

            if (!IsEligible(candidate, sourceIds, alreadyExcluded, excludeOutOfStock))
                continue;

            result.Add(candidate);
        }

        return result;
    }

    private static bool IsInStock(Product product)
    {
        if (!product.HasVariants)
            return product.Inventory.InStock;

        return product.Variants.Any(v => v.AllowBackorder || v.Quantity > 0);
    }
}
