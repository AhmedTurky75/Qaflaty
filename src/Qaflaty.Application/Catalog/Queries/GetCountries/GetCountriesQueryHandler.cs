using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Catalog.Queries.GetCountries;

public class GetCountriesQueryHandler : IQueryHandler<GetCountriesQuery, List<CountryDto>>
{
    private readonly ICountryRepository _countryRepository;

    public GetCountriesQueryHandler(ICountryRepository countryRepository)
    {
        _countryRepository = countryRepository;
    }

    public async Task<Result<List<CountryDto>>> Handle(GetCountriesQuery request, CancellationToken cancellationToken)
    {
        var countries = await _countryRepository.GetAllActiveAsync(cancellationToken);

        var dtos = countries
            .Select(c => new CountryDto(c.Id, c.Name, c.Code))
            .ToList();

        return Result.Success(dtos);
    }
}
