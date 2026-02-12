using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.ValueObjects;

namespace Qaflaty.Application.Catalog.Commands.UpdateProductVariant;

public class UpdateProductVariantCommandHandler : ICommandHandler<UpdateProductVariantCommand>
{
    private readonly IProductRepository _productRepository;

    public UpdateProductVariantCommandHandler(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<Result> Handle(UpdateProductVariantCommand request, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(request.ProductId, cancellationToken);
        if (product == null)
            return Result.Failure(new Error("Product.NotFound", "Product not found"));

        // Create price override if provided
        Money? priceOverride = null;
        if (request.PriceOverride.HasValue)
        {
            var currency = string.IsNullOrWhiteSpace(request.PriceOverrideCurrency)
                ? Currency.SAR
                : Enum.Parse<Currency>(request.PriceOverrideCurrency);

            var moneyResult = Money.Create(request.PriceOverride.Value, currency);
            if (moneyResult.IsFailure)
                return Result.Failure(moneyResult.Error);

            priceOverride = moneyResult.Value;
        }

        var result = product.UpdateVariant(request.VariantId, request.Sku, priceOverride, request.AllowBackorder);
        if (result.IsFailure)
            return result;

        _productRepository.Update(product);

        return Result.Success();
    }
}
