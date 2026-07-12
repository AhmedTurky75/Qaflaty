using Qaflaty.Domain.Communication.Aggregates.Knowledge;

namespace Qaflaty.Application.Ai.DTOs;

public static class KnowledgeDocumentMapping
{
    public static KnowledgeDocumentDto ToDto(this KnowledgeDocument document) => new(
        document.Id.Value,
        document.SourceType.ToString(),
        document.Status.ToString(),
        document.Title,
        document.OriginalFileName,
        document.ContentType,
        document.ChunkCount,
        document.ErrorMessage,
        document.CreatedAt,
        document.UpdatedAt);
}
