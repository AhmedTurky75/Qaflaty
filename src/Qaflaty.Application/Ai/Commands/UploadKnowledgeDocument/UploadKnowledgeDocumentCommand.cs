using Qaflaty.Application.Ai.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Ai.Commands.UploadKnowledgeDocument;

/// <summary>
/// Uploads a knowledge document for a store. The file is stored and a Pending document is created;
/// chunking + embedding happen asynchronously in the background worker.
/// </summary>
public sealed record UploadKnowledgeDocumentCommand(
    Guid StoreId,
    Stream Content,
    string FileName,
    string ContentType,
    string? Title) : ICommand<KnowledgeDocumentDto>;
