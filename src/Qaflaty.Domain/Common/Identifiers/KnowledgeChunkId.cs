namespace Qaflaty.Domain.Common.Identifiers;

public readonly record struct KnowledgeChunkId(Guid Value)
{
    public static KnowledgeChunkId New() => new(Guid.NewGuid());
    public static KnowledgeChunkId Empty => new(Guid.Empty);
    public static KnowledgeChunkId From(Guid guid) => new(guid);
    public override string ToString() => Value.ToString();
}
