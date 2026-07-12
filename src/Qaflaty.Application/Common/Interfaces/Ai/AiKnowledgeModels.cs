namespace Qaflaty.Application.Common.Interfaces.Ai;

/// <summary>
/// Chunk <c>DocType</c> discriminators, persisted on every chunk and used by the reply handler to
/// tell product chunks (which carry suggestion metadata) from store/FAQ/uploaded knowledge.
/// </summary>
public static class AiKnowledgeDocumentType
{
    public const string Store = "store";
    public const string Faq = "faq";
    public const string Product = "product";
    public const string Upload = "upload";
}
