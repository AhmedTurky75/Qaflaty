namespace Qaflaty.Application.Common.Interfaces.Ai;

/// <summary>A request to (re)process an uploaded knowledge document: extract → chunk → embed → store.</summary>
public sealed record KnowledgeIngestionRequest(Guid StoreId, Guid DocumentId);

/// <summary>
/// In-process fast path handing uploaded documents to the background embedding worker so the upload
/// request returns immediately. Durability comes from the document row's <c>Pending</c> status: a
/// dropped item (restart, full buffer) can be re-queued by re-processing pending documents.
/// </summary>
public interface IKnowledgeIngestionQueue
{
    ValueTask EnqueueAsync(KnowledgeIngestionRequest request, CancellationToken ct = default);

    IAsyncEnumerable<KnowledgeIngestionRequest> ReadAllAsync(CancellationToken ct);
}
