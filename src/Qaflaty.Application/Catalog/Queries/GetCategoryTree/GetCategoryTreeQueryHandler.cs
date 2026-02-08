using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetCategoryTree;

public class GetCategoryTreeQueryHandler : IQueryHandler<GetCategoryTreeQuery, List<CategoryTreeDto>>
{
    public Task<List<CategoryTreeDto>> Handle(GetCategoryTreeQuery request, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("GetCategoryTreeQueryHandler will be implemented in a later phase");
    }
}
