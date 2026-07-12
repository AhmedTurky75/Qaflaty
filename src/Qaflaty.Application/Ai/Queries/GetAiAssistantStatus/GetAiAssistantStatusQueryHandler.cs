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
    private readonly IVectorStore _vectorStore;
    private readonly IAiChatCompletionService _chatService;
    private readonly IAiEmbeddingService _embeddingService;

    public GetAiAssistantStatusQueryHandler(
        IStoreConfigurationRepository configRepository,
        IVectorStore vectorStore,
        IAiChatCompletionService chatService,
        IAiEmbeddingService embeddingService)
    {
        _configRepository = configRepository;
        _vectorStore = vectorStore;
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
        var stats = await _vectorStore.GetStatsAsync(storeId, cancellationToken);

        var dto = new AiAssistantStatusDto(
            settings.Enabled,
            settings.DisableHumanChat,
            _chatService.IsConfigured && _embeddingService.IsConfigured,
            stats.TotalChunks > 0,
            stats.ProductCount,
            stats.FaqCount,
            stats.StorePageCount,
            stats.TotalChunks,
            stats.LastUpdatedUtc);

        return Result.Success(dto);
    }
}
