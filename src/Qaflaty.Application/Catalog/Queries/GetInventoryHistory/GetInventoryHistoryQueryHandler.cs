using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Catalog.Queries.GetInventoryHistory;

public class GetInventoryHistoryQueryHandler : IQueryHandler<GetInventoryHistoryQuery, List<InventoryMovementDto>>
{
    private readonly IProductRepository _productRepository;

    public GetInventoryHistoryQueryHandler(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<Result<List<InventoryMovementDto>>> Handle(GetInventoryHistoryQuery request, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(request.ProductId, cancellationToken);
        if (product == null)
            return Result.Failure<List<InventoryMovementDto>>(
                new Error("Product.NotFound", "Product not found"));

        var movements = product.InventoryMovements
            .Where(im => !request.VariantId.HasValue || im.VariantId == request.VariantId)
            .OrderByDescending(im => im.CreatedAt)
            .Skip(request.Skip)
            .Take(request.Take)
            .Select(im => new InventoryMovementDto(
                im.Id,
                im.ProductId.Value,
                im.VariantId,
                im.QuantityChange,
                im.QuantityAfter,
                im.Type.ToString(),
                im.Reason,
                im.OrderId?.Value,
                im.CreatedAt))
            .ToList();

        return Result.Success(movements);
    }
}
