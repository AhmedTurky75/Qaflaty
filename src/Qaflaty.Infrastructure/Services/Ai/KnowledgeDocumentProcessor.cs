using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Common.Interfaces.Ai;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Aggregates.Knowledge;

namespace Qaflaty.Infrastructure.Services.Ai;

/// <summary>
/// Background worker that embeds uploaded knowledge documents off the request thread:
/// extract text → chunk → embed → persist vectors → mark Ready/Failed. One DI scope per document.
/// </summary>
public sealed class KnowledgeDocumentProcessor : BackgroundService
{
    private readonly IKnowledgeIngestionQueue _queue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<KnowledgeDocumentProcessor> _logger;

    public KnowledgeDocumentProcessor(
        IKnowledgeIngestionQueue queue,
        IServiceScopeFactory scopeFactory,
        ILogger<KnowledgeDocumentProcessor> logger)
    {
        _queue = queue;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var request in _queue.ReadAllAsync(stoppingToken))
        {
            try
            {
                await ProcessAsync(request, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error processing knowledge document {DocumentId}", request.DocumentId);
            }
        }
    }

    private async Task ProcessAsync(KnowledgeIngestionRequest request, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var sp = scope.ServiceProvider;

        var repository = sp.GetRequiredService<IKnowledgeDocumentRepository>();
        var unitOfWork = sp.GetRequiredService<IUnitOfWork>();
        var storage = sp.GetRequiredService<IFileStorageService>();
        var extractors = sp.GetServices<IDocumentTextExtractor>();
        var chunker = sp.GetRequiredService<IDocumentChunker>();
        var embeddingService = sp.GetRequiredService<IAiEmbeddingService>();
        var vectorStore = sp.GetRequiredService<IVectorStore>();

        var storeId = StoreId.From(request.StoreId);
        var documentId = KnowledgeDocumentId.From(request.DocumentId);

        var document = await repository.GetByIdAsync(storeId, documentId, ct);
        if (document is null)
        {
            _logger.LogWarning("Knowledge document {DocumentId} not found for processing", request.DocumentId);
            return;
        }

        document.MarkProcessing();
        repository.Update(document);
        await unitOfWork.SaveChangesAsync(ct);

        try
        {
            if (!embeddingService.IsConfigured)
            {
                await FailAsync(document, repository, unitOfWork, "The AI embedding service is not configured.", ct);
                return;
            }

            if (string.IsNullOrWhiteSpace(document.StoragePath))
            {
                await FailAsync(document, repository, unitOfWork, "The uploaded file is missing.", ct);
                return;
            }

            var text = await ExtractTextAsync(document, storage, extractors, ct);
            if (text is null)
            {
                await FailAsync(document, repository, unitOfWork,
                    "Unsupported file type or the file could not be read.", ct);
                return;
            }

            var chunkTexts = chunker.Chunk(text);
            if (chunkTexts.Count == 0)
            {
                await FailAsync(document, repository, unitOfWork, "The document contained no extractable text.", ct);
                return;
            }

            var embeddings = await embeddingService.GenerateEmbeddingsAsync(
                chunkTexts, AiEmbeddingInputType.Document, ct);

            if (embeddings.Count != chunkTexts.Count)
            {
                await FailAsync(document, repository, unitOfWork,
                    "The embedding service returned an unexpected number of vectors.", ct);
                return;
            }

            var chunks = new List<VectorChunk>(chunkTexts.Count);
            for (var i = 0; i < chunkTexts.Count; i++)
            {
                chunks.Add(new VectorChunk(
                    documentId,
                    storeId,
                    i,
                    AiKnowledgeDocumentType.Upload,
                    document.Title,
                    chunkTexts[i],
                    embeddings[i]));
            }

            await vectorStore.ReplaceDocumentChunksAsync(storeId, documentId, chunks, ct);

            document.MarkReady(chunks.Count);
            repository.Update(document);
            await unitOfWork.SaveChangesAsync(ct);

            _logger.LogInformation(
                "Embedded knowledge document {DocumentId} for store {StoreId}: {Chunks} chunks",
                request.DocumentId, request.StoreId, chunks.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to embed knowledge document {DocumentId}", request.DocumentId);
            await FailAsync(document, repository, unitOfWork, "Processing failed. Please try again.", ct);
        }
    }

    private static async Task<string?> ExtractTextAsync(
        KnowledgeDocument document,
        IFileStorageService storage,
        IEnumerable<IDocumentTextExtractor> extractors,
        CancellationToken ct)
    {
        var contentType = document.ContentType ?? string.Empty;
        var fileName = document.OriginalFileName ?? string.Empty;

        var extractor = extractors.FirstOrDefault(e => e.CanExtract(contentType, fileName));
        if (extractor is null)
            return null;

        await using var stream = await storage.OpenReadAsync(document.StoragePath!, ct);
        if (stream is null)
            return null;

        var text = await extractor.ExtractTextAsync(stream, contentType, fileName, ct);
        return string.IsNullOrWhiteSpace(text) ? null : text;
    }

    private static async Task FailAsync(
        KnowledgeDocument document,
        IKnowledgeDocumentRepository repository,
        IUnitOfWork unitOfWork,
        string error,
        CancellationToken ct)
    {
        document.MarkFailed(error);
        repository.Update(document);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
