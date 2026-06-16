namespace Qaflaty.Domain.Common.Identifiers;

public readonly record struct AiInteractionId(Guid Value)
{
    public static AiInteractionId New() => new(Guid.NewGuid());
    public static AiInteractionId Empty => new(Guid.Empty);
    public static AiInteractionId From(Guid guid) => new(guid);
    public override string ToString() => Value.ToString();
}
