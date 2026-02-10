using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;

namespace Qaflaty.Application.Catalog.Commands.UpdateProductPricing;

public class UpdateProductPricingCommandHandler : ICommandHandler<UpdateProductPricingCommand>
{
    private readonly IProductRepository _productRepository;

    public UpdateProductPricingCommandHandler(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<Result> Handle(UpdateProductPricingCommand request, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(new ProductId(request.ProductId), cancellationToken);

        if (product is null)
            return Result.Failure(CatalogErrors.ProductNotFound);

        var priceResult = Money.Create(request.Price);
        if (priceResult.IsFailure)
            return Result.Failure(priceResult.Error);

        Money? compareAtPrice = null;
        if (request.CompareAtPrice.HasValue)
        {
            var compareResult = Money.Create(request.CompareAtPrice.Value);
            if (compareResult.IsFailure)
                return Result.Failure(compareResult.Error);
            compareAtPrice = compareResult.Value;
        }

        var pricingResult = ProductPricing.Create(priceResult.Value, compareAtPrice);
        if (pricingResult.IsFailure)
            return Result.Failure(pricingResult.Error);

        var updateResult = product.UpdatePricing(pricingResult.Value);
        if (updateResult.IsFailure)
            return updateResult;

        _productRepository.Update(product);

        return Result.Success();
    }
}
