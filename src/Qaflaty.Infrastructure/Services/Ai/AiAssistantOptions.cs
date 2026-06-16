namespace Qaflaty.Infrastructure.Services.Ai;

/// <summary>
/// Binds the "AiAssistant" configuration section. Points at an OpenAI-compatible
/// endpoint such as a local LM Studio server.
/// </summary>
public sealed class AiAssistantOptions
{
    public const string SectionName = "AiAssistant";

    /// <summary>Base URL of the OpenAI-compatible API, e.g. "http://localhost:1234/v1".</summary>
    public string Endpoint { get; set; } = string.Empty;

    /// <summary>API key. LM Studio ignores the value but the header must be present.</summary>
    public string ApiKey { get; set; } = "lm-studio";

    public string ChatModel { get; set; } = "Qwen2.5-0.5B-Instruct";

    public string EmbeddingModel { get; set; } = "nomic-embed-text-v1.5";

    public int TimeoutSeconds { get; set; } = 60;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(Endpoint);
}
