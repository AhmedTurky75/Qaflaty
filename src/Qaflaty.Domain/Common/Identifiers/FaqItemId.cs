namespace Qaflaty.Domain.Common.Identifiers;

public readonly record struct FaqItemId(Guid Value)
{
    public static FaqItemId New() => new(Guid.NewGuid());
    public static FaqItemId Empty => new(Guid.Empty);
    public static FaqItemId From(Guid guid) => new(guid);
    public override string ToString() => Value.ToString();
}
