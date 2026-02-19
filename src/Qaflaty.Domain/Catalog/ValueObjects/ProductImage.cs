using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed class ProductImage : ValueObject
{
    public Guid Id { get; }
    public string Url { get; }
    public string? AltText { get; }
    public int SortOrder { get; private set; }

    private ProductImage() { Id = Guid.Empty; Url = string.Empty; } // required by EF Core JSON deserialization

    private ProductImage(Guid id, string url, string? altText, int sortOrder)
    {
        Id = id;
        Url = url;
        AltText = altText;
        SortOrder = sortOrder;
    }

    public static ProductImage Create(string url, string? altText = null, int sortOrder = 0)
    {
        return new ProductImage(Guid.NewGuid(), url, altText, sortOrder);
    }

    public static ProductImage Restore(Guid id, string url, string? altText, int sortOrder)
    {
        return new ProductImage(id, url, altText, sortOrder);
    }

    public void UpdateSortOrder(int sortOrder) => SortOrder = sortOrder;

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Id;
        yield return Url;
        yield return AltText;
        yield return SortOrder;
    }
}
