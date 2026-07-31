namespace Qaflaty.Application.Ai.DTOs;

/// <summary>A knowledge document as shown in the merchant "Knowledge / Documents" list.</summary>
public sealed record KnowledgeDocumentDto(
    Guid Id,
    string SourceType,
    string Status,
    string Title,
    string? OriginalFileName,
    string? ContentType,
    int ChunkCount,
    string? ErrorMessage,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc);
