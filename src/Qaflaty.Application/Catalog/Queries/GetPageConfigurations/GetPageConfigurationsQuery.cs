using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetPageConfigurations;

public record GetPageConfigurationsQuery(Guid StoreId) : IQuery<List<PageConfigurationDto>>;
