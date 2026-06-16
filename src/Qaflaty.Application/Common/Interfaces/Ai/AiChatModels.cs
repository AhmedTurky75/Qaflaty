namespace Qaflaty.Application.Common.Interfaces.Ai;

public enum AiChatRole
{
    System,
    User,
    Assistant
}

public sealed record AiChatMessage(AiChatRole Role, string Content);

public sealed record AiChatCompletionOptions(
    double Temperature = 0.4,
    int MaxTokens = 600);

public sealed record AiChatCompletionResult(
    string Content,
    int? PromptTokens = null,
    int? CompletionTokens = null);
