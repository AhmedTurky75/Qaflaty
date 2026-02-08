using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;

namespace Qaflaty.Application.Catalog.Commands.CreateProduct;

public class CreateProductCommandHandler : ICommandHandler<CreateProductCommand, ProductDto>
{
    private readonly IProductRepository _productRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;

    public CreateProductCommandHandler(
        IProductRepository productRepository,
        IStoreRepository storeRepository,
        ICurrentUserService currentUserService)
    {
        _productRepository = productRepository;
        _storeRepository = storeRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result<ProductDto>> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        // Verify store ownership
        var storeId = new StoreId(request.StoreId);
        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        if (store == null || store.MerchantId.Value != _currentUserService.MerchantId?.Value)
            return Result.Failure<ProductDto>(new Error("Product.Unauthorized", "You don't have access to this store"));

        // Create product name
        var nameResult = ProductName.Create(request.Name);
        if (nameResult.IsFailure)
            return Result.Failure<ProductDto>(nameResult.Error);

        // Create slug
        var slugResult = ProductSlug.Create(request.Slug);
        if (slugResult.IsFailure)
            return Result.Failure<ProductDto>(slugResult.Error);

        // Check slug availability
        var isSlugAvailable = await _productRepository.IsSlugAvailableAsync(storeId, slugResult.Value, null, cancellationToken);
        if (!isSlugAvailable)
            return Result.Failure<ProductDto>(new Error("Product.SlugTaken", "This slug is already taken"));

        // Create pricing
        var priceResult = Money.Create(request.Price);
        if (priceResult.IsFailure)
            return Result.Failure<ProductDto>(priceResult.Error);

        Money? compareAtPrice = null;
        if (request.CompareAtPrice.HasValue)
        {
            var compareResult = Money.Create(request.CompareAtPrice.Value);
            if (compareResult.IsFailure)
                return Result.Failure<ProductDto>(compareResult.Error);
            compareAtPrice = compareResult.Value;
        }

        var pricingResult = ProductPricing.Create(priceResult.Value, compareAtPrice);
        if (pricingResult.IsFailure)
            return Result.Failure<ProductDto>(pricingResult.Error);

        // Create inventory
        var inventoryResult = ProductInventory.Create(request.Quantity, request.Sku, request.TrackInventory);
        if (inventoryResult.IsFailure)
            return Result.Failure<ProductDto>(inventoryResult.Error);

        // Create product
        var productResult = Product.Create(
            storeId,
            nameResult.Value,
            slugResult.Value,
            pricingResult.Value,
            inventoryResult.Value);

        if (productResult.IsFailure)
            return Result.Failure<ProductDto>(productResult.Error);

        var product = productResult.Value;

        // Update additional info
        CategoryId? categoryId = request.CategoryId.HasValue ? new CategoryId(request.CategoryId.Value) : null;
        product.UpdateInfo(nameResult.Value, request.Description, categoryId);

        await _productRepository.AddAsync(product, cancellationToken);

        var dto = new ProductDto(
            product.Id.Value,
            product.Slug.Value,
            product.Name.Value,
            product.Description,
            product.Pricing.Price.Amount,
            product.Pricing.CompareAtPrice?.Amount,
            product.Inventory.Quantity,
            product.Inventory.Sku,
            product.Inventory.TrackInventory,
            product.Status.ToString(),
            product.CategoryId?.Value,
            new List<ProductImageDto>(),
            product.CreatedAt);

        return Result.Success(dto);
    }
}
