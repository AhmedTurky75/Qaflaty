using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetStoreConfiguration;

public record GetStoreConfigurationQuery(Guid StoreId) : IQuery<StoreConfigurationDto>;
