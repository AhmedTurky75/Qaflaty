namespace Qaflaty.Application.Common.Interfaces.Ai;

/// <summary>
/// Whether text is being embedded as a stored document or as a search query.
/// Asymmetric embedding models (e.g. nomic-embed-text) require a different task-instruction
/// prefix for each, and retrieval silently returns wrong results if they are mismatched.
/// </summary>
public enum AiEmbeddingInputType
{
    Document,
    Query
}

/// <summary>
/// Abstraction over an OpenAI-compatible embeddings endpoint (e.g. LM Studio / nomic-embed-text).
/// </summary>
public interface IAiEmbeddingService
{
    /// <summary>True when an endpoint/model are configured and the service can be called.</summary>
    bool IsConfigured { get; }

    Task<float[]> GenerateEmbeddingAsync(
        string input,
        AiEmbeddingInputType inputType = AiEmbeddingInputType.Document,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<float[]>> GenerateEmbeddingsAsync(
        IReadOnlyList<string> inputs,
        AiEmbeddingInputType inputType = AiEmbeddingInputType.Document,
        CancellationToken cancellationToken = default);
}
