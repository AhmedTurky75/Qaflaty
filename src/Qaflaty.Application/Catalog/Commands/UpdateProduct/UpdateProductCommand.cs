using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.UpdateProduct;

public record UpdateProductCommand(
    Guid ProductId,
    string Name,
    string Slug,
    string? Description,
    Guid? CategoryId
) : ICommand<ProductDto>;
