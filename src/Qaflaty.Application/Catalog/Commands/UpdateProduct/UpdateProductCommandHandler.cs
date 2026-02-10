using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;

namespace Qaflaty.Application.Catalog.Commands.UpdateProduct;

public class UpdateProductCommandHandler : ICommandHandler<UpdateProductCommand, ProductDto>
{
    private readonly IProductRepository _productRepository;

    public UpdateProductCommandHandler(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<Result<ProductDto>> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(new ProductId(request.ProductId), cancellationToken);

        if (product is null)
            return Result.Failure<ProductDto>(CatalogErrors.ProductNotFound);

        // Validate name
        var nameResult = ProductName.Create(request.Name);
        if (nameResult.IsFailure)
            return Result.Failure<ProductDto>(nameResult.Error);

        // Validate slug
        var slugResult = ProductSlug.Create(request.Slug);
        if (slugResult.IsFailure)
            return Result.Failure<ProductDto>(slugResult.Error);

        // Check slug availability if changed
        if (product.Slug.Value != request.Slug)
        {
            var isSlugAvailable = await _productRepository.IsSlugAvailableAsync(
                product.StoreId, slugResult.Value, product.Id, cancellationToken);

            if (!isSlugAvailable)
                return Result.Failure<ProductDto>(CatalogErrors.SlugAlreadyExists);
        }

        // Update info
        CategoryId? categoryId = request.CategoryId.HasValue ? new CategoryId(request.CategoryId.Value) : null;
        var updateInfoResult = product.UpdateInfo(nameResult.Value, slugResult.Value, request.Description, categoryId);
        if (updateInfoResult.IsFailure)
            return Result.Failure<ProductDto>(updateInfoResult.Error);

        // Update pricing
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

        var updatePricingResult = product.UpdatePricing(pricingResult.Value);
        if (updatePricingResult.IsFailure)
            return Result.Failure<ProductDto>(updatePricingResult.Error);

        // Update inventory
        var inventoryResult = ProductInventory.Create(request.Quantity, request.Sku, request.TrackInventory);
        if (inventoryResult.IsFailure)
            return Result.Failure<ProductDto>(inventoryResult.Error);

        var updateInventoryResult = product.UpdateInventory(inventoryResult.Value);
        if (updateInventoryResult.IsFailure)
            return Result.Failure<ProductDto>(updateInventoryResult.Error);

        // Update status
        if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<ProductStatus>(request.Status, true, out var status))
        {
            if (status == ProductStatus.Active)
                product.Activate();
            else if (status == ProductStatus.Inactive)
                product.Deactivate();
        }

        _productRepository.Update(product);

        return Result.Success(new ProductDto(
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
            product.Images.Select(i => new ProductImageDto(
                i.Id,
                i.Url,
                i.AltText,
                i.SortOrder
            )).OrderBy(i => i.SortOrder).ToList(),
            product.CreatedAt));
    }
}
