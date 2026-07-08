using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetPageVariants;

public record GetPageVariantsQuery(Guid PageId) : IQuery<List<PageVariantDto>>;
