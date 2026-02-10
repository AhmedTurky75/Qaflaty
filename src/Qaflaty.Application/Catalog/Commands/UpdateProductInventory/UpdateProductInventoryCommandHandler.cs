using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.UpdateProductInventory;

public class UpdateProductInventoryCommandHandler : ICommandHandler<UpdateProductInventoryCommand>
{
    private readonly IProductRepository _productRepository;

    public UpdateProductInventoryCommandHandler(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<Result> Handle(UpdateProductInventoryCommand request, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(new ProductId(request.ProductId), cancellationToken);

        if (product is null)
            return Result.Failure(CatalogErrors.ProductNotFound);

        var inventoryResult = ProductInventory.Create(request.Quantity, request.Sku, request.TrackInventory);
        if (inventoryResult.IsFailure)
            return Result.Failure(inventoryResult.Error);

        var updateResult = product.UpdateInventory(inventoryResult.Value);
        if (updateResult.IsFailure)
            return updateResult;

        _productRepository.Update(product);

        return Result.Success();
    }
}
