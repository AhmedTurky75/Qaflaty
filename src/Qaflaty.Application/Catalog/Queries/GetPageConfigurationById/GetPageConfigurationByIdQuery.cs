using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetPageConfigurationById;

public record GetPageConfigurationByIdQuery(Guid PageId) : IQuery<PageConfigurationDto>;
