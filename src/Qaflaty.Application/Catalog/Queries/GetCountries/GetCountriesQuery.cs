using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetCountries;

public record GetCountriesQuery : IQuery<List<CountryDto>>;

public record CountryDto(int Id, string Name, string Code);
