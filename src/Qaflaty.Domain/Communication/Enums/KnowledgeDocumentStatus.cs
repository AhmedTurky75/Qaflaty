namespace Qaflaty.Domain.Communication.Enums;

/// <summary>
/// Processing lifecycle of a knowledge document. Derived documents are created directly as
/// <see cref="Ready"/>; uploaded documents move Pending → Processing → Ready/Failed as the
/// background embedding worker chunks and embeds them.
/// </summary>
public enum KnowledgeDocumentStatus
{
    Pending = 0,
    Processing = 1,
    Ready = 2,
    Failed = 3
}
