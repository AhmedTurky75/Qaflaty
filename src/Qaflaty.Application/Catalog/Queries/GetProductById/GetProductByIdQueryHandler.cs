using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Exceptions;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Queries.GetProductById;

public class GetProductByIdQueryHandler : IQueryHandler<GetProductByIdQuery, ProductDto>
{
    private readonly IProductRepository _productRepository;

    public GetProductByIdQueryHandler(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<ProductDto> Handle(GetProductByIdQuery request, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(new ProductId(request.ProductId), cancellationToken);

        if (product is null)
            throw new NotFoundException("Product", request.ProductId.ToString());

        return new ProductDto(
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
            product.CreatedAt);
    }
}
