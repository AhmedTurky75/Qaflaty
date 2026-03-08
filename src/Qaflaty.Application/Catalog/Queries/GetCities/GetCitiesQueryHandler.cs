using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Catalog.Queries.GetCities;

public class GetCitiesQueryHandler : IQueryHandler<GetCitiesQuery, List<CityDto>>
{
    private readonly ICityRepository _cityRepository;

    public GetCitiesQueryHandler(ICityRepository cityRepository)
    {
        _cityRepository = cityRepository;
    }

    public async Task<Result<List<CityDto>>> Handle(GetCitiesQuery request, CancellationToken cancellationToken)
    {
        var cities = await _cityRepository.GetByCountryAsync(request.CountryId, cancellationToken);

        var dtos = cities
            .Select(c => new CityDto(c.Id, c.Name, c.CountryId))
            .ToList();

        return Result.Success(dtos);
    }
}
