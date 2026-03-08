using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetCities;

public record GetCitiesQuery(int CountryId) : IQuery<List<CityDto>>;

public record CityDto(int Id, string Name, int CountryId);
