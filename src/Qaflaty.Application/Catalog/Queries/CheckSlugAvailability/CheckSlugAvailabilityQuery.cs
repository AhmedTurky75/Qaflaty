using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.CheckSlugAvailability;

public record CheckSlugAvailabilityQuery(string Slug) : IQuery<bool>;
