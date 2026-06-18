using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Qaflaty.Application.Common.Interfaces.Ai;

namespace Qaflaty.Infrastructure.Services.Ai;

/// <summary>
/// Chat completion via an OpenAI-compatible /chat/completions endpoint (LM Studio or Ollama).
/// </summary>
public sealed class OpenAiCompatibleChatCompletionService : IAiChatCompletionService
{
    private readonly HttpClient _httpClient;
    private readonly AiAssistantOptions _options;
    private readonly ILogger<OpenAiCompatibleChatCompletionService> _logger;

    public OpenAiCompatibleChatCompletionService(
        HttpClient httpClient,
        IOptions<AiAssistantOptions> options,
        ILogger<OpenAiCompatibleChatCompletionService> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public bool IsConfigured => _options.IsConfigured;

    public async Task<AiChatCompletionResult> CompleteAsync(
        IReadOnlyList<AiChatMessage> messages,
        AiChatCompletionOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
            throw new InvalidOperationException("AI chat completion endpoint is not configured.");

        options ??= new AiChatCompletionOptions();

        var request = new ChatRequest
        {
            Model = _options.EffectiveChatModel,
            Temperature = options.Temperature,
            MaxTokens = options.MaxTokens,
            Messages = messages.Select(m => new ChatRequestMessage
            {
                Role = RoleToString(m.Role),
                Content = m.Content
            }).ToList()
        };

        using var response = await _httpClient.PostAsJsonAsync(
            BuildUrl("chat/completions"), request, JsonOptions, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError(
                "AI chat completion failed with status {Status}: {Body}", response.StatusCode, body);
            throw new HttpRequestException(
                $"AI chat completion request failed with status {(int)response.StatusCode}.");
        }

        var payload = await response.Content.ReadFromJsonAsync<ChatResponse>(JsonOptions, cancellationToken);
        var content = payload?.Choices?.FirstOrDefault()?.Message?.Content?.Trim() ?? string.Empty;

        return new AiChatCompletionResult(
            content,
            payload?.Usage?.PromptTokens,
            payload?.Usage?.CompletionTokens);
    }

    private string BuildUrl(string path) => $"{_options.EffectiveEndpoint.TrimEnd('/')}/{path}";

    private static string RoleToString(AiChatRole role) => role switch
    {
        AiChatRole.System => "system",
        AiChatRole.Assistant => "assistant",
        _ => "user"
    };

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        PropertyNameCaseInsensitive = true
    };

    private sealed class ChatRequest
    {
        [JsonPropertyName("model")] public string Model { get; set; } = string.Empty;
        [JsonPropertyName("messages")] public List<ChatRequestMessage> Messages { get; set; } = new();
        [JsonPropertyName("temperature")] public double Temperature { get; set; }
        [JsonPropertyName("max_tokens")] public int MaxTokens { get; set; }
    }

    private sealed class ChatRequestMessage
    {
        [JsonPropertyName("role")] public string Role { get; set; } = "user";
        [JsonPropertyName("content")] public string Content { get; set; } = string.Empty;
    }

    private sealed class ChatResponse
    {
        [JsonPropertyName("choices")] public List<ChatChoice>? Choices { get; set; }
        [JsonPropertyName("usage")] public ChatUsage? Usage { get; set; }
    }

    private sealed class ChatChoice
    {
        [JsonPropertyName("message")] public ChatRequestMessage? Message { get; set; }
    }

    private sealed class ChatUsage
    {
        [JsonPropertyName("prompt_tokens")] public int? PromptTokens { get; set; }
        [JsonPropertyName("completion_tokens")] public int? CompletionTokens { get; set; }
    }
}
