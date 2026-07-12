using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Common.Interfaces.Ai;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Aggregates.Knowledge;

namespace Qaflaty.Application.Ai.Commands.DeleteKnowledgeDocument;

public sealed class DeleteKnowledgeDocumentCommandHandler : ICommandHandler<DeleteKnowledgeDocumentCommand>
{
    private readonly IKnowledgeDocumentRepository _knowledgeRepository;
    private readonly IVectorStore _vectorStore;
    private readonly IFileStorageService _fileStorage;

    public DeleteKnowledgeDocumentCommandHandler(
        IKnowledgeDocumentRepository knowledgeRepository,
        IVectorStore vectorStore,
        IFileStorageService fileStorage)
    {
        _knowledgeRepository = knowledgeRepository;
        _vectorStore = vectorStore;
        _fileStorage = fileStorage;
    }

    public async Task<Result> Handle(DeleteKnowledgeDocumentCommand request, CancellationToken cancellationToken)
    {
        var storeId = StoreId.From(request.StoreId);
        var documentId = KnowledgeDocumentId.From(request.DocumentId);

        var document = await _knowledgeRepository.GetByIdAsync(storeId, documentId, cancellationToken);
        if (document is null)
            return Result.Failure(new Error("Knowledge.DocumentNotFound", "Knowledge document not found."));

        // Remove vectors explicitly (pluggable backends may not honour the DB cascade).
        await _vectorStore.DeleteDocumentChunksAsync(storeId, documentId, cancellationToken);

        if (!string.IsNullOrWhiteSpace(document.StoragePath))
            await _fileStorage.DeleteAsync(document.StoragePath!, cancellationToken);

        _knowledgeRepository.Delete(document);
        // The document row (and, at the DB level, any remaining chunks) is committed by the pipeline.

        return Result.Success();
    }
}
