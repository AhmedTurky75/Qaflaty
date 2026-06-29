namespace Qaflaty.Domain.Common.Identifiers;

public readonly record struct ProductReviewId(Guid Value)
{
    public static ProductReviewId New() => new(Guid.NewGuid());
    public static ProductReviewId Empty => new(Guid.Empty);
    public override string ToString() => Value.ToString();
}
