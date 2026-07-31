using Qaflaty.Application.Ai.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Aggregates.Knowledge;

namespace Qaflaty.Application.Ai.Queries.GetKnowledgeDocuments;

public sealed class GetKnowledgeDocumentsQueryHandler
    : IQueryHandler<GetKnowledgeDocumentsQuery, IReadOnlyList<KnowledgeDocumentDto>>
{
    private readonly IKnowledgeDocumentRepository _knowledgeRepository;

    public GetKnowledgeDocumentsQueryHandler(IKnowledgeDocumentRepository knowledgeRepository)
    {
        _knowledgeRepository = knowledgeRepository;
    }

    public async Task<Result<IReadOnlyList<KnowledgeDocumentDto>>> Handle(
        GetKnowledgeDocumentsQuery request, CancellationToken cancellationToken)
    {
        var storeId = StoreId.From(request.StoreId);
        var documents = await _knowledgeRepository.GetByStoreAsync(storeId, cancellationToken);

        IReadOnlyList<KnowledgeDocumentDto> dtos = documents.Select(d => d.ToDto()).ToList();
        return Result.Success(dtos);
    }
}
