namespace Qaflaty.Domain.Common.Identifiers;

public readonly record struct ChatMessageId(Guid Value)
{
    public static ChatMessageId New() => new(Guid.NewGuid());
    public static ChatMessageId Empty => new(Guid.Empty);
    public static ChatMessageId From(Guid guid) => new(guid);
    public override string ToString() => Value.ToString();
}
