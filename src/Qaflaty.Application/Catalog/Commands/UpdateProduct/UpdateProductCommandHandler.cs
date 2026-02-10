using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

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

        var nameResult = ProductName.Create(request.Name);
        if (nameResult.IsFailure)
            return Result.Failure<ProductDto>(nameResult.Error);

        var slugResult = ProductSlug.Create(request.Slug);
        if (slugResult.IsFailure)
            return Result.Failure<ProductDto>(slugResult.Error);

        // Check slug availability (exclude current product)
        if (product.Slug.Value != request.Slug)
        {
            var isSlugAvailable = await _productRepository.IsSlugAvailableAsync(
                product.StoreId, slugResult.Value, product.Id, cancellationToken);

            if (!isSlugAvailable)
                return Result.Failure<ProductDto>(CatalogErrors.SlugAlreadyExists);
        }

        CategoryId? categoryId = request.CategoryId.HasValue ? new CategoryId(request.CategoryId.Value) : null;

        var updateResult = product.UpdateInfo(nameResult.Value, slugResult.Value, request.Description, categoryId);
        if (updateResult.IsFailure)
            return Result.Failure<ProductDto>(updateResult.Error);

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
