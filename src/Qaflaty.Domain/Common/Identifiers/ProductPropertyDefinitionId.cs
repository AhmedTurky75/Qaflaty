namespace Qaflaty.Domain.Common.Identifiers;

public readonly record struct ProductPropertyDefinitionId(Guid Value)
{
    public static ProductPropertyDefinitionId New() => new(Guid.NewGuid());
    public static ProductPropertyDefinitionId Empty => new(Guid.Empty);
    public static ProductPropertyDefinitionId From(Guid guid) => new(guid);
    public override string ToString() => Value.ToString();
}
