using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetProductLandingPage;

public record GetProductLandingPageQuery(Guid ProductId) : IQuery<PageConfigurationDto>;
