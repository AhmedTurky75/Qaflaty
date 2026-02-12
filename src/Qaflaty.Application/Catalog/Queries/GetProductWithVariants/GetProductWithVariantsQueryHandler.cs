using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Catalog.Queries.GetProductWithVariants;

public class GetProductWithVariantsQueryHandler : IQueryHandler<GetProductWithVariantsQuery, ProductWithVariantsDto>
{
    private readonly IProductRepository _productRepository;

    public GetProductWithVariantsQueryHandler(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<Result<ProductWithVariantsDto>> Handle(GetProductWithVariantsQuery request, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(request.ProductId, cancellationToken);
        if (product == null)
            return Result.Failure<ProductWithVariantsDto>(
                new Error("Product.NotFound", "Product not found"));

        var variantOptions = product.VariantOptions
            .Select(vo => new VariantOptionDto(vo.Name, vo.Values))
            .ToList();

        var variants = product.Variants
            .Select(v => new ProductVariantDto(
                v.Id,
                product.Id.Value,
                v.Attributes,
                v.Sku,
                v.PriceOverride?.Amount,
                v.PriceOverride?.Currency.ToString(),
                v.Quantity,
                v.AllowBackorder,
                v.CreatedAt,
                v.UpdatedAt))
            .ToList();

        var dto = new ProductWithVariantsDto(
            product.Id.Value,
            product.Name.Value,
            product.Slug.Value,
            product.Description,
            product.Pricing.Price.Amount,
            product.Pricing.Price.Currency.ToString(),
            product.HasVariants,
            variantOptions,
            variants);

        return Result.Success(dto);
    }
}
