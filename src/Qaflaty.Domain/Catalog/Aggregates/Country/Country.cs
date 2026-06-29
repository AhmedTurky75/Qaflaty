namespace Qaflaty.Domain.Catalog.Aggregates.Country;

public sealed class Country
{
    public int Id { get; private set; } // Numeric primary key of the country (seeded reference data)
    public string Name { get; private set; } = null!; // Country display name, e.g. "Saudi Arabia"
    public string Code { get; private set; } = null!; // ISO 3166-1 alpha-2 country code, e.g. "SA"
    public bool IsActive { get; private set; } // Whether the country is selectable for addresses/delivery

    private Country() { }

    public static Country Create(int id, string name, string code, bool isActive = true)
        => new Country { Id = id, Name = name, Code = code, IsActive = isActive };
}
