namespace Qaflaty.Application.Common.Interfaces.Ai;

/// <summary>
/// Abstraction over an OpenAI-compatible embeddings endpoint (e.g. LM Studio / nomic-embed-text).
/// </summary>
public interface IAiEmbeddingService
{
    /// <summary>True when an endpoint/model are configured and the service can be called.</summary>
    bool IsConfigured { get; }

    Task<float[]> GenerateEmbeddingAsync(string input, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<float[]>> GenerateEmbeddingsAsync(
        IReadOnlyList<string> inputs,
        CancellationToken cancellationToken = default);
}
