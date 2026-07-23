using Qaflaty.Domain.Catalog.Aggregates.Product;

namespace Qaflaty.Application.Storefront.Recommendations;

/// <summary>
/// The price used to compare products for upsell/downsell ranking. For variant products this is
/// the lowest ("starting from") variant price, matching how the storefront displays a price badge
/// for products with variants.
/// </summary>
internal static class EffectivePriceCalculator
{
    public static decimal GetEffectivePrice(Product product)
    {
        if (!product.HasVariants)
            return product.Pricing.Price.Amount;

        return product.Variants.Count == 0
            ? product.Pricing.Price.Amount
            : product.Variants.Min(v => v.PriceOverride?.Amount ?? product.Pricing.Price.Amount);
    }
}
