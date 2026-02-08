using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetProductBySlug;

public class GetProductBySlugQueryHandler : IQueryHandler<GetProductBySlugQuery, ProductPublicDto>
{
    public Task<ProductPublicDto> Handle(GetProductBySlugQuery request, CancellationToken cancellationToken)
    {
        // TODO: Implement product lookup by slug
        throw new NotImplementedException("GetProductBySlugQuery handler will be implemented in a later phase");
    }
}
