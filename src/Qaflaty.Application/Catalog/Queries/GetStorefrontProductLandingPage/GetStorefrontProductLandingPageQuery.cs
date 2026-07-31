using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetStorefrontProductLandingPage;

public record GetStorefrontProductLandingPageQuery(Guid StoreId, string Slug) : IQuery<PageConfigurationDto>;
