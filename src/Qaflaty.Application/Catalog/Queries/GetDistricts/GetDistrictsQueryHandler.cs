using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Catalog.Queries.GetDistricts;

public class GetDistrictsQueryHandler : IQueryHandler<GetDistrictsQuery, List<DistrictDto>>
{
    private readonly IDistrictRepository _districtRepository;

    public GetDistrictsQueryHandler(IDistrictRepository districtRepository)
    {
        _districtRepository = districtRepository;
    }

    public async Task<Result<List<DistrictDto>>> Handle(
        GetDistrictsQuery request, CancellationToken cancellationToken)
    {
        var districts = await _districtRepository.GetByCityAsync(request.CityId, cancellationToken);
        var dtos = districts.Select(d => new DistrictDto(d.Id, d.Name, d.NameAr, d.CityId)).ToList();
        return Result.Success(dtos);
    }
}
