using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Common.ValueObjects;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed class ProductPricing : ValueObject
{
    public Money Price { get; private set; } = null!; // Current selling price (what the customer pays), e.g. 79.00 SAR
    public Money? CompareAtPrice { get; private set; } // Optional original/"was" price for showing a markdown; must be higher than Price, e.g. 99.00 SAR

    public bool HasDiscount => CompareAtPrice != null; // True when a compare-at price is set (product is on sale)
    public decimal DiscountPercentage => HasDiscount // Computed % off relative to compare-at price, e.g. 20 for "20% off"
        ? Math.Round(((CompareAtPrice!.Amount - Price.Amount) / CompareAtPrice.Amount) * 100, 2)
        : 0;
    public Money? DiscountAmount => HasDiscount ? CompareAtPrice!.Subtract(Price) : null; // Computed money saved (compare-at minus price), e.g. 20.00 SAR

    private ProductPricing() { }

    private ProductPricing(Money price, Money? compareAtPrice)
    {
        Price = price;
        CompareAtPrice = compareAtPrice;
    }

    public static Result<ProductPricing> Create(Money price, Money? compareAtPrice = null)
    {
        if (price.Amount <= 0)
            return Result.Failure<ProductPricing>(CatalogErrors.InvalidPricing);

        if (compareAtPrice != null && compareAtPrice.Amount <= price.Amount)
            return Result.Failure<ProductPricing>(CatalogErrors.CompareAtPriceTooLow);

        return Result.Success(new ProductPricing(price, compareAtPrice));
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Price;
        yield return CompareAtPrice;
    }
}
