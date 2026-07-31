namespace Qaflaty.Domain.Catalog.Aggregates.City;

public sealed class City
{
    public int Id { get; private set; } // Numeric primary key of the city (seeded reference data)
    public int CountryId { get; private set; } // Country this city belongs to (FK to Country.Id)
    public string Name { get; private set; } = null!; // City display name, e.g. "Riyadh"
    public bool IsActive { get; private set; } // Whether the city is selectable for addresses/delivery

    private City() { }

    public static City Create(int id, int countryId, string name, bool isActive = true)
        => new City { Id = id, CountryId = countryId, Name = name, IsActive = isActive };
}
