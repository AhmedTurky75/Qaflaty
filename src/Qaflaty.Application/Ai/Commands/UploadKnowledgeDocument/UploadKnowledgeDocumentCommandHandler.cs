using Qaflaty.Application.Ai.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Common.Interfaces.Ai;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Aggregates.Knowledge;

namespace Qaflaty.Application.Ai.Commands.UploadKnowledgeDocument;

public sealed class UploadKnowledgeDocumentCommandHandler
    : ICommandHandler<UploadKnowledgeDocumentCommand, KnowledgeDocumentDto>
{
    private readonly IFileStorageService _fileStorage;
    private readonly IKnowledgeDocumentRepository _knowledgeRepository;
    private readonly IKnowledgeIngestionQueue _queue;
    private readonly IUnitOfWork _unitOfWork;

    public UploadKnowledgeDocumentCommandHandler(
        IFileStorageService fileStorage,
        IKnowledgeDocumentRepository knowledgeRepository,
        IKnowledgeIngestionQueue queue,
        IUnitOfWork unitOfWork)
    {
        _fileStorage = fileStorage;
        _knowledgeRepository = knowledgeRepository;
        _queue = queue;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<KnowledgeDocumentDto>> Handle(
        UploadKnowledgeDocumentCommand request, CancellationToken cancellationToken)
    {
        var storeId = StoreId.From(request.StoreId);

        string storagePath;
        try
        {
            storagePath = await _fileStorage.UploadAsync(
                request.Content, request.FileName, request.ContentType, cancellationToken);
        }
        catch (Exception)
        {
            return Result.Failure<KnowledgeDocumentDto>(
                new Error("Knowledge.UploadFailed", "The file could not be stored."));
        }

        var title = string.IsNullOrWhiteSpace(request.Title) ? request.FileName : request.Title!.Trim();
        var document = KnowledgeDocument.CreateUpload(
            storeId, title, request.FileName, request.ContentType, storagePath);

        await _knowledgeRepository.AddAsync(document, cancellationToken);

        // Persist before enqueueing so the background worker can always load the row it is handed.
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _queue.EnqueueAsync(
            new KnowledgeIngestionRequest(storeId.Value, document.Id.Value), cancellationToken);

        return Result.Success(document.ToDto());
    }
}
