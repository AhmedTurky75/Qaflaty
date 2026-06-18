namespace Qaflaty.Infrastructure.Services.Ai;

public enum AiProvider { None, LmStudio, Ollama }

/// <summary>
/// Binds the "AiAssistant" configuration section.
/// Set <see cref="Provider"/> to <c>LmStudio</c> or <c>Ollama</c>; all other fields are optional
/// and fall back to sensible per-provider defaults when left empty.
/// </summary>
public sealed class AiAssistantOptions
{
    public const string SectionName = "AiAssistant";

    /// <summary>Which local AI backend to use. Leave as <c>None</c> to disable AI features.</summary>
    public AiProvider Provider { get; set; } = AiProvider.None;

    /// <summary>
    /// Override the base URL of the OpenAI-compatible API.
    /// When empty, defaults to "http://localhost:1234/v1" (LmStudio) or
    /// "http://localhost:11434/v1" (Ollama).
    /// </summary>
    public string Endpoint { get; set; } = string.Empty;

    /// <summary>
    /// Override the API key sent as Bearer token.
    /// When empty, defaults to "lm-studio" for LmStudio or omitted for Ollama.
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>Override the chat/completion model name.</summary>
    public string ChatModel { get; set; } = string.Empty;

    /// <summary>Override the text embedding model name.</summary>
    public string EmbeddingModel { get; set; } = string.Empty;

    public int TimeoutSeconds { get; set; } = 60;

    public bool IsConfigured => Provider != AiProvider.None;

    public string EffectiveEndpoint => !string.IsNullOrWhiteSpace(Endpoint)
        ? Endpoint
        : Provider switch
        {
            AiProvider.LmStudio => "http://localhost:1234/v1",
            AiProvider.Ollama   => "http://localhost:11434/v1",
            _                   => string.Empty
        };

    public string EffectiveChatModel => !string.IsNullOrWhiteSpace(ChatModel)
        ? ChatModel
        : Provider switch
        {
            AiProvider.LmStudio => "Qwen2.5-0.5B-Instruct",
            AiProvider.Ollama   => "llama3.2:1b",
            _                   => string.Empty
        };

    public string EffectiveEmbeddingModel => !string.IsNullOrWhiteSpace(EmbeddingModel)
        ? EmbeddingModel
        : Provider switch
        {
            AiProvider.LmStudio => "nomic-embed-text-v1.5",
            AiProvider.Ollama   => "nomic-embed-text",
            _                   => string.Empty
        };

    public string EffectiveApiKey => !string.IsNullOrWhiteSpace(ApiKey)
        ? ApiKey
        : Provider == AiProvider.LmStudio ? "lm-studio" : string.Empty;
}
