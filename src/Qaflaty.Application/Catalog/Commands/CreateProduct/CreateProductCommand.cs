using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.CreateProduct;

public record CreateProductCommand(
    Guid StoreId,
    string Name,
    string Slug,
    string? Description,
    decimal Price,
    decimal? CompareAtPrice,
    int Quantity,
    string? Sku,
    bool TrackInventory,
    Guid? CategoryId,
    string? Status,
    List<ProductImageInput>? Images
) : ICommand<ProductDto>;
