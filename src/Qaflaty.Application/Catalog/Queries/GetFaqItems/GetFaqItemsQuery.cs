using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetFaqItems;

public record GetFaqItemsQuery(Guid StoreId, bool PublishedOnly = false) : IQuery<List<FaqItemDto>>;
