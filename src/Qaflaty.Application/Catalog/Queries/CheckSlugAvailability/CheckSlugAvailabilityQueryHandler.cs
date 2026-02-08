using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.CheckSlugAvailability;

public class CheckSlugAvailabilityQueryHandler : IQueryHandler<CheckSlugAvailabilityQuery, bool>
{
    public Task<bool> Handle(CheckSlugAvailabilityQuery request, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("CheckSlugAvailabilityQueryHandler will be implemented in a later phase");
    }
}
