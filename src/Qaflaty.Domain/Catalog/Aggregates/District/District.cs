namespace Qaflaty.Domain.Catalog.Aggregates.District;

public sealed class District
{
    public int Id { get; private set; } // Numeric primary key of the district (seeded reference data)
    public int CityId { get; private set; } // City this district belongs to (FK to City.Id)
    public string Name { get; private set; } = null!; // District name in English, e.g. "Al Olaya"
    public string? NameAr { get; private set; } // District name in Arabic, e.g. "العليا"
    public bool IsActive { get; private set; } // Whether the district is selectable for addresses/delivery

    private District() { }

    public static District Create(int id, int cityId, string name, string? nameAr = null, bool isActive = true)
        => new District
        {
            Id = id,
            CityId = cityId,
            Name = name,
            NameAr = nameAr,
            IsActive = isActive
        };
}
