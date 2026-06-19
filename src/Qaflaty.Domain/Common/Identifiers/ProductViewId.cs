namespace Qaflaty.Domain.Common.Identifiers;

public readonly record struct ProductViewId(Guid Value)
{
    public static ProductViewId New() => new(Guid.NewGuid());
    public static ProductViewId Empty => new(Guid.Empty);
    public override string ToString() => Value.ToString();
}
