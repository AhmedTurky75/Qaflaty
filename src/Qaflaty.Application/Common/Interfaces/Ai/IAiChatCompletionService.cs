namespace Qaflaty.Application.Common.Interfaces.Ai;

/// <summary>
/// Abstraction over an OpenAI-compatible chat completion endpoint (e.g. LM Studio).
/// Implementations talk to the configured LLM; the application layer stays provider-agnostic.
/// </summary>
public interface IAiChatCompletionService
{
    /// <summary>True when an endpoint/model are configured and the service can be called.</summary>
    bool IsConfigured { get; }

    Task<AiChatCompletionResult> CompleteAsync(
        IReadOnlyList<AiChatMessage> messages,
        AiChatCompletionOptions? options = null,
        CancellationToken cancellationToken = default);
}
