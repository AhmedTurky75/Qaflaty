namespace Qaflaty.Domain.Common.Identifiers;

public readonly record struct ChatConversationId(Guid Value)
{
    public static ChatConversationId New() => new(Guid.NewGuid());
    public static ChatConversationId Empty => new(Guid.Empty);
    public static ChatConversationId From(Guid guid) => new(guid);
    public override string ToString() => Value.ToString();
}
