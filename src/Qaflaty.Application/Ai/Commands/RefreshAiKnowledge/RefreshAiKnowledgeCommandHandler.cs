using Microsoft.Extensions.Logging;
using Qaflaty.Application.Ai.DTOs;
using Qaflaty.Application.Ai.Knowledge;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces.Ai;
using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Ai.Commands.RefreshAiKnowledge;

public sealed class RefreshAiKnowledgeCommandHandler
    : ICommandHandler<RefreshAiKnowledgeCommand, AiKnowledgeRefreshResultDto>
{
    private readonly IStoreRepository _storeRepository;
    private readonly IStoreConfigurationRepository _configRepository;
    private readonly IFaqItemRepository _faqRepository;
    private readonly IProductRepository _productRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IProductPropertyDefinitionRepository _propertyDefinitionRepository;
    private readonly IAiEmbeddingService _embeddingService;
    private readonly IAiKnowledgeStore _knowledgeStore;
    private readonly ILogger<RefreshAiKnowledgeCommandHandler> _logger;

    public RefreshAiKnowledgeCommandHandler(
        IStoreRepository storeRepository,
        IStoreConfigurationRepository configRepository,
        IFaqItemRepository faqRepository,
        IProductRepository productRepository,
        ICategoryRepository categoryRepository,
        IProductPropertyDefinitionRepository propertyDefinitionRepository,
        IAiEmbeddingService embeddingService,
        IAiKnowledgeStore knowledgeStore,
        ILogger<RefreshAiKnowledgeCommandHandler> logger)
    {
        _storeRepository = storeRepository;
        _configRepository = configRepository;
        _faqRepository = faqRepository;
        _productRepository = productRepository;
        _categoryRepository = categoryRepository;
        _propertyDefinitionRepository = propertyDefinitionRepository;
        _embeddingService = embeddingService;
        _knowledgeStore = knowledgeStore;
        _logger = logger;
    }

    public async Task<Result<AiKnowledgeRefreshResultDto>> Handle(
        RefreshAiKnowledgeCommand request,
        CancellationToken cancellationToken)
    {
        if (!_embeddingService.IsConfigured)
            return Result.Failure<AiKnowledgeRefreshResultDto>(
                new Error("Ai.NotConfigured", "The AI embedding service is not configured."));

        var storeId = StoreId.From(request.StoreId);

        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        if (store is null)
            return Result.Failure<AiKnowledgeRefreshResultDto>(CatalogErrors.StoreNotFound);

        var config = await _configRepository.GetByStoreIdAsync(storeId, cancellationToken);
        if (config is null)
            return Result.Failure<AiKnowledgeRefreshResultDto>(CatalogErrors.StoreConfigurationNotFound);

        var faqs = await _faqRepository.GetPublishedByStoreIdAsync(storeId, cancellationToken);

        var allProducts = await _productRepository.GetByStoreIdWithPropertyValuesAsync(storeId, cancellationToken);
        var products = allProducts.Where(p => p.Status == ProductStatus.Active).ToList();

        var categories = await _categoryRepository.GetByStoreIdAsync(storeId, cancellationToken);
        var categoryNames = categories.ToDictionary(c => c.Id.Value, c => c.Name.Value);

        var propertyDefinitions = await _propertyDefinitionRepository.GetByStoreAsync(storeId, cancellationToken);
        var propertyDefMap = propertyDefinitions.ToDictionary(d => d.Id.Value, d => d);

        var drafts = AiKnowledgeContentBuilder.Build(
            store, config, faqs, products, categoryNames, propertyDefMap);

        if (drafts.Count == 0)
        {
            _knowledgeStore.ReplaceStoreDocuments(storeId.Value, Array.Empty<AiKnowledgeDocument>());
            return Result.Success(new AiKnowledgeRefreshResultDto(0, 0, 0, 0, DateTime.UtcNow));
        }

        IReadOnlyList<float[]> embeddings;
        try
        {
            embeddings = await _embeddingService.GenerateEmbeddingsAsync(
                drafts.Select(d => d.Content).ToList(),
                AiEmbeddingInputType.Document,
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate embeddings while refreshing AI knowledge for store {StoreId}", storeId.Value);
            return Result.Failure<AiKnowledgeRefreshResultDto>(
                new Error("Ai.EmbeddingFailed", "Failed to generate embeddings. Check the AI service connection."));
        }

        if (embeddings.Count != drafts.Count)
            return Result.Failure<AiKnowledgeRefreshResultDto>(
                new Error("Ai.EmbeddingMismatch", "The embedding service returned an unexpected number of vectors."));

        // Secondary name-only embeddings (products). Embedded in one batch and mapped back to
        // their draft by position so an explicitly-named product can be scored on its name alone.
        var nameDraftIndices = new List<int>();
        var nameTexts = new List<string>();
        for (var i = 0; i < drafts.Count; i++)
        {
            if (!string.IsNullOrWhiteSpace(drafts[i].NameForEmbedding))
            {
                nameDraftIndices.Add(i);
                nameTexts.Add(drafts[i].NameForEmbedding!);
            }
        }

        var nameEmbeddingByDraft = new Dictionary<int, float[]>();
        if (nameTexts.Count > 0)
        {
            IReadOnlyList<float[]> nameEmbeddings;
            try
            {
                nameEmbeddings = await _embeddingService.GenerateEmbeddingsAsync(
                    nameTexts, AiEmbeddingInputType.Document, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate name embeddings while refreshing AI knowledge for store {StoreId}", storeId.Value);
                return Result.Failure<AiKnowledgeRefreshResultDto>(
                    new Error("Ai.EmbeddingFailed", "Failed to generate embeddings. Check the AI service connection."));
            }

            if (nameEmbeddings.Count != nameTexts.Count)
                return Result.Failure<AiKnowledgeRefreshResultDto>(
                    new Error("Ai.EmbeddingMismatch", "The embedding service returned an unexpected number of vectors."));

            for (var j = 0; j < nameDraftIndices.Count; j++)
                nameEmbeddingByDraft[nameDraftIndices[j]] = nameEmbeddings[j];
        }

        var documents = new List<AiKnowledgeDocument>(drafts.Count);
        for (var i = 0; i < drafts.Count; i++)
        {
            var draft = drafts[i];
            nameEmbeddingByDraft.TryGetValue(i, out var nameEmbedding);
            documents.Add(new AiKnowledgeDocument(
                draft.Id,
                storeId.Value,
                draft.Type,
                draft.Title,
                draft.Content,
                embeddings[i],
                draft.Metadata,
                nameEmbedding));
        }

        _knowledgeStore.ReplaceStoreDocuments(storeId.Value, documents);

        var result = new AiKnowledgeRefreshResultDto(
            documents.Count(d => d.Type == AiKnowledgeDocumentType.Product),
            documents.Count(d => d.Type == AiKnowledgeDocumentType.Faq),
            documents.Count(d => d.Type == AiKnowledgeDocumentType.Store),
            documents.Count,
            DateTime.UtcNow);

        _logger.LogInformation(
            "Refreshed AI knowledge for store {StoreId}: {Total} documents ({Products} products, {Faqs} FAQs, {Pages} store pages)",
            storeId.Value, result.TotalDocuments, result.ProductsEmbedded, result.FaqItemsEmbedded, result.StorePagesEmbedded);

        return Result.Success(result);
    }
}
