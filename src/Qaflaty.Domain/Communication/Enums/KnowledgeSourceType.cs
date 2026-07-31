namespace Qaflaty.Domain.Communication.Enums;

/// <summary>
/// Origin of a knowledge document. Derived sources are rebuilt automatically from store data by the
/// "Refresh AI Knowledge" action; <see cref="Upload"/> documents are files a merchant uploaded and
/// are never touched by the derived rebuild.
/// </summary>
public enum KnowledgeSourceType
{
    StoreProfile = 0,
    Faq = 1,
    Product = 2,
    Upload = 3
}
