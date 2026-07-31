using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Recommendations;

/// <summary>
/// Shared "same category / shared attributes / newest" affinity score used as the automatic
/// fallback by the related-products, cross-sell and upsell recommendation paths.
/// </summary>
internal static class CategoryAffinityScorer
{
    public static int Score(
        Product candidate,
        Product target,
        HashSet<(ProductPropertyDefinitionId, string)> targetProps)
    {
        var score = 0;

        if (candidate.CategoryId is not null && target.CategoryId is not null
            && candidate.CategoryId.Value == target.CategoryId.Value)
            score += 100;

        var shared = candidate.PropertyValues.Count(v => targetProps.Contains((v.DefinitionId, v.Value)));
        score += shared * 10;

        return score;
    }

    public static HashSet<(ProductPropertyDefinitionId, string)> BuildPropertySet(Product target)
        => target.PropertyValues.Select(v => (v.DefinitionId, v.Value)).ToHashSet();
}
