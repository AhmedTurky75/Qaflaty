using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetCustomPage;

public record GetCustomPageQuery(Guid StoreId, string Slug) : IQuery<PageConfigurationDto>;
