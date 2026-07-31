using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetPageExperiment;

public record GetPageExperimentQuery(Guid StoreId, string Slug) : IQuery<PageExperimentDto>;
