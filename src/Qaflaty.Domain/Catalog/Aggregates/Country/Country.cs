namespace Qaflaty.Domain.Catalog.Aggregates.Country;

public sealed class Country
{
    public int Id { get; private set; }
    public string Name { get; private set; } = null!;
    public string Code { get; private set; } = null!; // ISO 3166-1 alpha-2
    public bool IsActive { get; private set; }

    private Country() { }

    public static Country Create(int id, string name, string code, bool isActive = true)
        => new Country { Id = id, Name = name, Code = code, IsActive = isActive };
}
