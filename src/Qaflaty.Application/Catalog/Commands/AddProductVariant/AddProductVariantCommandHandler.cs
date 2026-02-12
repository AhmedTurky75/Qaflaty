using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.ValueObjects;

namespace Qaflaty.Application.Catalog.Commands.AddProductVariant;

public class AddProductVariantCommandHandler : ICommandHandler<AddProductVariantCommand, Guid>
{
    private readonly IProductRepository _productRepository;

    public AddProductVariantCommandHandler(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<Result<Guid>> Handle(AddProductVariantCommand request, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(request.ProductId, cancellationToken);
        if (product == null)
            return Result.Failure<Guid>(new Error("Product.NotFound", "Product not found"));

        // Create price override if provided
        Money? priceOverride = null;
        if (request.PriceOverride.HasValue)
        {
            var currency = string.IsNullOrWhiteSpace(request.PriceOverrideCurrency)
                ? Currency.SAR
                : Enum.Parse<Currency>(request.PriceOverrideCurrency);

            var moneyResult = Money.Create(request.PriceOverride.Value, currency);
            if (moneyResult.IsFailure)
                return Result.Failure<Guid>(moneyResult.Error);

            priceOverride = moneyResult.Value;
        }

        // Create variant
        var variantResult = ProductVariant.Create(
            request.ProductId,
            request.Attributes,
            request.Sku,
            priceOverride,
            request.Quantity,
            request.AllowBackorder);

        if (variantResult.IsFailure)
            return Result.Failure<Guid>(variantResult.Error);

        var variant = variantResult.Value;

        // Add variant to product
        var result = product.AddVariant(variant);
        if (result.IsFailure)
            return Result.Failure<Guid>(result.Error);

        _productRepository.Update(product);

        return Result.Success(variant.Id);
    }
}
