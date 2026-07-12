using Microsoft.Extensions.Logging;
using Qaflaty.Application.Ai.DTOs;
using Qaflaty.Application.Ai.Knowledge;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Common.Interfaces.Ai;
using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Aggregates.Knowledge;
using Qaflaty.Domain.Communication.Enums;

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
    private readonly IKnowledgeDocumentRepository _knowledgeRepository;
    private readonly IVectorStore _vectorStore;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<RefreshAiKnowledgeCommandHandler> _logger;

    public RefreshAiKnowledgeCommandHandler(
        IStoreRepository storeRepository,
        IStoreConfigurationRepository configRepository,
        IFaqItemRepository faqRepository,
        IProductRepository productRepository,
        ICategoryRepository categoryRepository,
        IProductPropertyDefinitionRepository propertyDefinitionRepository,
        IAiEmbeddingService embeddingService,
        IKnowledgeDocumentRepository knowledgeRepository,
        IVectorStore vectorStore,
        IUnitOfWork unitOfWork,
        ILogger<RefreshAiKnowledgeCommandHandler> logger)
    {
        _storeRepository = storeRepository;
        _configRepository = configRepository;
        _faqRepository = faqRepository;
        _productRepository = productRepository;
        _categoryRepository = categoryRepository;
        _propertyDefinitionRepository = propertyDefinitionRepository;
        _embeddingService = embeddingService;
        _knowledgeRepository = knowledgeRepository;
        _vectorStore = vectorStore;
        _unitOfWork = unitOfWork;
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

        // Existing derived documents keyed by their stable source key, so we can upsert in place and
        // remove any that no longer exist. Uploaded documents are never touched here.
        var existingDerived = await _knowledgeRepository.GetDerivedByStoreAsync(storeId, cancellationToken);
        var existingBySourceKey = existingDerived
            .Where(d => d.SourceKey is not null)
            .ToDictionary(d => d.SourceKey!, d => d);

        if (drafts.Count == 0)
        {
            // Nothing to embed — remove all derived documents (their chunks cascade-delete).
            foreach (var stale in existingDerived)
                _knowledgeRepository.Delete(stale);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return Result.Success(new AiKnowledgeRefreshResultDto(0, 0, 0, 0, DateTime.UtcNow));
        }

        var contentEmbeddings = await GenerateEmbeddingsOrThrow(
            drafts.Select(d => d.Content).ToList(), cancellationToken);
        if (contentEmbeddings.IsFailure)
            return Result.Failure<AiKnowledgeRefreshResultDto>(contentEmbeddings.Error);

        var embeddings = contentEmbeddings.Value;
        if (embeddings.Count != drafts.Count)
            return Result.Failure<AiKnowledgeRefreshResultDto>(
                new Error("Ai.EmbeddingMismatch", "The embedding service returned an unexpected number of vectors."));

        // Secondary name-only embeddings (products), mapped back to their draft by position.
        var nameEmbeddingByDraft = await BuildNameEmbeddings(drafts, cancellationToken);
        if (nameEmbeddingByDraft.IsFailure)
            return Result.Failure<AiKnowledgeRefreshResultDto>(nameEmbeddingByDraft.Error);

        // Phase 1: reconcile document rows (create / update / delete) and persist them so the chunk
        // foreign keys are satisfied before any chunk is written.
        var documentsByDraft = new Dictionary<int, KnowledgeDocument>();
        var seenSourceKeys = new HashSet<string>();
        for (var i = 0; i < drafts.Count; i++)
        {
            var draft = drafts[i];
            seenSourceKeys.Add(draft.Id);
            var sourceType = MapSourceType(draft.Type);

            if (existingBySourceKey.TryGetValue(draft.Id, out var existing))
            {
                existing.SyncDerived(draft.Title, chunkCount: 1);
                _knowledgeRepository.Update(existing);
                documentsByDraft[i] = existing;
            }
            else
            {
                var created = KnowledgeDocument.CreateDerived(storeId, sourceType, draft.Title, draft.Id, chunkCount: 1);
                await _knowledgeRepository.AddAsync(created, cancellationToken);
                documentsByDraft[i] = created;
            }
        }

        foreach (var stale in existingDerived.Where(d => d.SourceKey is null || !seenSourceKeys.Contains(d.SourceKey)))
            _knowledgeRepository.Delete(stale);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Phase 2: write the (single) chunk for each derived document.
        for (var i = 0; i < drafts.Count; i++)
        {
            var draft = drafts[i];
            var document = documentsByDraft[i];
            nameEmbeddingByDraft.Value.TryGetValue(i, out var nameEmbedding);

            var chunk = new VectorChunk(
                document.Id,
                storeId,
                ChunkIndex: 0,
                draft.Type,
                draft.Title,
                draft.Content,
                embeddings[i],
                nameEmbedding,
                draft.Metadata);

            await _vectorStore.ReplaceDocumentChunksAsync(storeId, document.Id, new[] { chunk }, cancellationToken);
        }

        var result = new AiKnowledgeRefreshResultDto(
            drafts.Count(d => d.Type == AiKnowledgeDocumentType.Product),
            drafts.Count(d => d.Type == AiKnowledgeDocumentType.Faq),
            drafts.Count(d => d.Type == AiKnowledgeDocumentType.Store),
            drafts.Count,
            DateTime.UtcNow);

        _logger.LogInformation(
            "Refreshed AI knowledge for store {StoreId}: {Total} documents ({Products} products, {Faqs} FAQs, {Pages} store pages)",
            storeId.Value, result.TotalDocuments, result.ProductsEmbedded, result.FaqItemsEmbedded, result.StorePagesEmbedded);

        return Result.Success(result);
    }

    private async Task<Result<IReadOnlyList<float[]>>> GenerateEmbeddingsOrThrow(
        IReadOnlyList<string> contents, CancellationToken ct)
    {
        try
        {
            var embeddings = await _embeddingService.GenerateEmbeddingsAsync(
                contents, AiEmbeddingInputType.Document, ct);
            return Result.Success(embeddings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate embeddings while refreshing AI knowledge");
            return Result.Failure<IReadOnlyList<float[]>>(
                new Error("Ai.EmbeddingFailed", "Failed to generate embeddings. Check the AI service connection."));
        }
    }

    private async Task<Result<Dictionary<int, float[]>>> BuildNameEmbeddings(
        IReadOnlyList<AiKnowledgeDraft> drafts, CancellationToken ct)
    {
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

        var map = new Dictionary<int, float[]>();
        if (nameTexts.Count == 0)
            return Result.Success(map);

        var nameEmbeddings = await GenerateEmbeddingsOrThrow(nameTexts, ct);
        if (nameEmbeddings.IsFailure)
            return Result.Failure<Dictionary<int, float[]>>(nameEmbeddings.Error);

        if (nameEmbeddings.Value.Count != nameTexts.Count)
            return Result.Failure<Dictionary<int, float[]>>(
                new Error("Ai.EmbeddingMismatch", "The embedding service returned an unexpected number of vectors."));

        for (var j = 0; j < nameDraftIndices.Count; j++)
            map[nameDraftIndices[j]] = nameEmbeddings.Value[j];

        return Result.Success(map);
    }

    private static KnowledgeSourceType MapSourceType(string draftType) => draftType switch
    {
        AiKnowledgeDocumentType.Product => KnowledgeSourceType.Product,
        AiKnowledgeDocumentType.Faq => KnowledgeSourceType.Faq,
        _ => KnowledgeSourceType.StoreProfile
    };
}
