using Qaflaty.Application.Ai.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Ai.Queries.GetKnowledgeDocumentById;

/// <summary>Returns a single knowledge document (status/detail), scoped to the owning store.</summary>
public sealed record GetKnowledgeDocumentByIdQuery(Guid StoreId, Guid DocumentId) : IQuery<KnowledgeDocumentDto>;
