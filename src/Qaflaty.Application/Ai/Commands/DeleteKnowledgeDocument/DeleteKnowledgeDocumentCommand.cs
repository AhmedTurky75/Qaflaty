using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Ai.Commands.DeleteKnowledgeDocument;

/// <summary>Deletes a knowledge document, its embedded chunks, and any stored file.</summary>
public sealed record DeleteKnowledgeDocumentCommand(Guid StoreId, Guid DocumentId) : ICommand;
