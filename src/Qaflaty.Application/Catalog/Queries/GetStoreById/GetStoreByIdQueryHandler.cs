using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetStoreById;

public class GetStoreByIdQueryHandler : IQueryHandler<GetStoreByIdQuery, StoreDto>
{
    public Task<StoreDto> Handle(GetStoreByIdQuery request, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("GetStoreByIdQueryHandler will be implemented in a later phase");
    }
}
