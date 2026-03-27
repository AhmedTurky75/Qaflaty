using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetProductPropertyDefinitions;

public record GetProductPropertyDefinitionsQuery(Guid StoreId) : IQuery<List<ProductPropertyDefinitionDto>>;
