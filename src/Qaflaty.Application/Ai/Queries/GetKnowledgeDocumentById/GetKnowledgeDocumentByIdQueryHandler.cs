using Qaflaty.Application.Ai.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Aggregates.Knowledge;

namespace Qaflaty.Application.Ai.Queries.GetKnowledgeDocumentById;

public sealed class GetKnowledgeDocumentByIdQueryHandler
    : IQueryHandler<GetKnowledgeDocumentByIdQuery, KnowledgeDocumentDto>
{
    private readonly IKnowledgeDocumentRepository _knowledgeRepository;

    public GetKnowledgeDocumentByIdQueryHandler(IKnowledgeDocumentRepository knowledgeRepository)
    {
        _knowledgeRepository = knowledgeRepository;
    }

    public async Task<Result<KnowledgeDocumentDto>> Handle(
        GetKnowledgeDocumentByIdQuery request, CancellationToken cancellationToken)
    {
        var storeId = StoreId.From(request.StoreId);
        var documentId = KnowledgeDocumentId.From(request.DocumentId);

        var document = await _knowledgeRepository.GetByIdAsync(storeId, documentId, cancellationToken);
        if (document is null)
            return Result.Failure<KnowledgeDocumentDto>(
                new Error("Knowledge.DocumentNotFound", "Knowledge document not found."));

        return Result.Success(document.ToDto());
    }
}
