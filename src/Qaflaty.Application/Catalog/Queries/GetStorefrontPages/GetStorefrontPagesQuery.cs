using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetStorefrontPages;

public record GetStorefrontPagesQuery(Guid StoreId) : IQuery<List<PageConfigurationDto>>;
