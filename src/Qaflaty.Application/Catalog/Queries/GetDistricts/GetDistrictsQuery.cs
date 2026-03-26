using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetDistricts;

public record DistrictDto(int Id, string Name, string? NameAr, int CityId);

public record GetDistrictsQuery(int CityId) : IQuery<List<DistrictDto>>;
