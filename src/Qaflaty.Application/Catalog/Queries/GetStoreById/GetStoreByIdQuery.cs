using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetStoreById;

public record GetStoreByIdQuery(Guid StoreId) : IQuery<StoreDto>;
