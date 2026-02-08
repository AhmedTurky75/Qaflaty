using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetProductById;

public record GetProductByIdQuery(Guid ProductId) : IQuery<ProductDto>;
