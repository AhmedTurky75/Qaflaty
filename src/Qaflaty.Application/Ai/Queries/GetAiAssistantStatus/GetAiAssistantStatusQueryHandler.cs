using Qaflaty.Application.Ai.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces.Ai;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Ai.Queries.GetAiAssistantStatus;

public sealed class GetAiAssistantStatusQueryHandler
    : IQueryHandler<GetAiAssistantStatusQuery, AiAssistantStatusDto>
{
    private readonly IStoreConfigurationRepository _configRepository;
    private readonly IAiKnowledgeStore _knowledgeStore;
    private readonly IAiChatCompletionService _chatService;
    private readonly IAiEmbeddingService _embeddingService;

    public GetAiAssistantStatusQueryHandler(
        IStoreConfigurationRepository configRepository,
        IAiKnowledgeStore knowledgeStore,
        IAiChatCompletionService chatService,
        IAiEmbeddingService embeddingService)
    {
        _configRepository = configRepository;
        _knowledgeStore = knowledgeStore;
        _chatService = chatService;
        _embeddingService = embeddingService;
    }

    public async Task<Result<AiAssistantStatusDto>> Handle(
        GetAiAssistantStatusQuery request,
        CancellationToken cancellationToken)
    {
        var storeId = StoreId.From(request.StoreId);
        var config = await _configRepository.GetByStoreIdAsync(storeId, cancellationToken);
        if (config is null)
            return Result.Failure<AiAssistantStatusDto>(CatalogErrors.StoreConfigurationNotFound);

        var settings = config.AiAssistantSettings;
        var stats = _knowledgeStore.GetStats(storeId.Value);

        var dto = new AiAssistantStatusDto(
            settings.Enabled,
            settings.DisableHumanChat,
            _chatService.IsConfigured && _embeddingService.IsConfigured,
            _knowledgeStore.HasKnowledge(storeId.Value),
            stats?.ProductCount ?? 0,
            stats?.FaqCount ?? 0,
            stats?.StorePageCount ?? 0,
            stats?.TotalDocuments ?? 0,
            stats?.LastRefreshedAtUtc);

        return Result.Success(dto);
    }
}
