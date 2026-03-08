namespace Qaflaty.Domain.Catalog.Aggregates.City;

public sealed class City
{
    public int Id { get; private set; }
    public int CountryId { get; private set; }
    public string Name { get; private set; } = null!;
    public bool IsActive { get; private set; }

    private City() { }

    public static City Create(int id, int countryId, string name, bool isActive = true)
        => new City { Id = id, CountryId = countryId, Name = name, IsActive = isActive };
}
