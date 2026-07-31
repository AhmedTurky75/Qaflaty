using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Queries.GetLowStockItems;

public class GetLowStockItemsQueryHandler : IQueryHandler<GetLowStockItemsQuery, IReadOnlyList<LowStockItemDto>>
{
    private const int MinThreshold = 0;
    private const int MaxThreshold = 1000;

    private readonly IProductRepository _productRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetLowStockItemsQueryHandler(
        IProductRepository productRepository,
        IStoreRepository storeRepository,
        ICurrentUserService currentUserService)
    {
        _productRepository = productRepository;
        _storeRepository = storeRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result<IReadOnlyList<LowStockItemDto>>> Handle(
        GetLowStockItemsQuery request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);

        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        if (store == null ||
            !await _storeRepository.CanMerchantAccessStoreAsync(
                _currentUserService.MerchantId ?? default, store.Id, cancellationToken))
            return Result.Failure<IReadOnlyList<LowStockItemDto>>(Error.Unauthorized);

        var threshold = Math.Clamp(request.Threshold, MinThreshold, MaxThreshold);

        var products = await _productRepository.GetByStoreIdWithVariantsAsync(storeId, cancellationToken);

        var items = new List<LowStockItemDto>();

        foreach (var product in products)
        {
            if (product.HasVariants)
            {
                // Stock lives on the variant for these products, so the parent's Inventory.Quantity
                // is not a figure the merchant can act on — report each variant on its own row.
                foreach (var variant in product.Variants.Where(v => v.Quantity <= threshold))
                {
                    items.Add(new LowStockItemDto(
                        product.Id.Value,
                        product.Name.Value,
                        variant.Sku,
                        variant.Quantity,
                        threshold,
                        variant.Id,
                        new Dictionary<string, string>(variant.Attributes)));
                }

                continue;
            }

            // Products that opt out of inventory tracking (digital goods and the like) are always in
            // stock, so a low quantity on them is not an alert.
            if (!product.Inventory.TrackInventory || product.Inventory.Quantity > threshold)
                continue;

            items.Add(new LowStockItemDto(
                product.Id.Value,
                product.Name.Value,
                product.Inventory.Sku ?? string.Empty,
                product.Inventory.Quantity,
                threshold));
        }

        // Most urgent first: whatever is closest to selling out needs restocking soonest.
        var ordered = items
            .OrderBy(i => i.Quantity)
            .ThenBy(i => i.ProductName)
            .ToList();

        return Result.Success<IReadOnlyList<LowStockItemDto>>(ordered);
    }
}
