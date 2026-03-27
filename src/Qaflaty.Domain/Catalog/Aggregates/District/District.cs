namespace Qaflaty.Domain.Catalog.Aggregates.District;

public sealed class District
{
    public int Id { get; private set; }
    public int CityId { get; private set; }
    public string Name { get; private set; } = null!;
    public string? NameAr { get; private set; }
    public bool IsActive { get; private set; }

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
