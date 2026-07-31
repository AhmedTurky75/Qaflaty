namespace Qaflaty.Domain.Common.Identifiers;

public readonly record struct KnowledgeDocumentId(Guid Value)
{
    public static KnowledgeDocumentId New() => new(Guid.NewGuid());
    public static KnowledgeDocumentId Empty => new(Guid.Empty);
    public static KnowledgeDocumentId From(Guid guid) => new(guid);
    public override string ToString() => Value.ToString();
}
