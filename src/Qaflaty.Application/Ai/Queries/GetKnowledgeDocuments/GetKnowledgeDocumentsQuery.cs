using Qaflaty.Application.Ai.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Ai.Queries.GetKnowledgeDocuments;

/// <summary>Lists all knowledge documents (derived + uploaded) for a store.</summary>
public sealed record GetKnowledgeDocumentsQuery(Guid StoreId) : IQuery<IReadOnlyList<KnowledgeDocumentDto>>;
