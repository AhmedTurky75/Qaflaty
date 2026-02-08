using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Common.ValueObjects;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed class ProductPricing : ValueObject
{
    public Money Price { get; }
    public Money? CompareAtPrice { get; }

    public bool HasDiscount => CompareAtPrice != null;
    public decimal DiscountPercentage => HasDiscount
        ? Math.Round(((CompareAtPrice!.Amount - Price.Amount) / CompareAtPrice.Amount) * 100, 2)
        : 0;
    public Money? DiscountAmount => HasDiscount ? CompareAtPrice!.Subtract(Price) : null;

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
