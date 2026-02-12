using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Queries.GetProductWithVariants;

public record GetProductWithVariantsQuery(ProductId ProductId) : IQuery<ProductWithVariantsDto>;
