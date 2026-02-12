using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Catalog.Commands.AdjustVariantInventory;

public class AdjustVariantInventoryCommandHandler : ICommandHandler<AdjustVariantInventoryCommand>
{
    private readonly IProductRepository _productRepository;

    public AdjustVariantInventoryCommandHandler(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<Result> Handle(AdjustVariantInventoryCommand request, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(request.ProductId, cancellationToken);
        if (product == null)
            return Result.Failure(new Error("Product.NotFound", "Product not found"));

        var result = product.AdjustVariantInventory(
            request.VariantId,
            request.QuantityChange,
            request.MovementType,
            request.Reason);

        if (result.IsFailure)
            return result;

        _productRepository.Update(product);

        return Result.Success();
    }
}
