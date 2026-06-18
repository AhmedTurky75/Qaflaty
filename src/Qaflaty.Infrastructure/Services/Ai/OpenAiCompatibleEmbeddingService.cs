using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Qaflaty.Application.Common.Interfaces.Ai;

namespace Qaflaty.Infrastructure.Services.Ai;

/// <summary>
/// Embeddings via an OpenAI-compatible /embeddings endpoint (LM Studio or Ollama).
/// </summary>
public sealed class OpenAiCompatibleEmbeddingService : IAiEmbeddingService
{
    private readonly HttpClient _httpClient;
    private readonly AiAssistantOptions _options;
    private readonly ILogger<OpenAiCompatibleEmbeddingService> _logger;

    public OpenAiCompatibleEmbeddingService(
        HttpClient httpClient,
        IOptions<AiAssistantOptions> options,
        ILogger<OpenAiCompatibleEmbeddingService> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public bool IsConfigured => _options.IsConfigured;

    public async Task<float[]> GenerateEmbeddingAsync(string input, CancellationToken cancellationToken = default)
    {
        var result = await GenerateEmbeddingsAsync(new[] { input }, cancellationToken);
        return result.Count > 0 ? result[0] : Array.Empty<float>();
    }

    public async Task<IReadOnlyList<float[]>> GenerateEmbeddingsAsync(
        IReadOnlyList<string> inputs,
        CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
            throw new InvalidOperationException("AI embedding endpoint is not configured.");

        if (inputs.Count == 0)
            return Array.Empty<float[]>();

        var request = new EmbeddingRequest
        {
            Model = _options.EffectiveEmbeddingModel,
            Input = inputs.ToList()
        };

        using var response = await _httpClient.PostAsJsonAsync(
            BuildUrl("embeddings"), request, JsonOptions, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError(
                "AI embedding request failed with status {Status}: {Body}", response.StatusCode, body);
            throw new HttpRequestException(
                $"AI embedding request failed with status {(int)response.StatusCode}.");
        }

        var payload = await response.Content.ReadFromJsonAsync<EmbeddingResponse>(JsonOptions, cancellationToken);

        return payload?.Data?
            .OrderBy(d => d.Index)
            .Select(d => d.Embedding ?? Array.Empty<float>())
            .ToList() ?? new List<float[]>();
    }

    private string BuildUrl(string path) => $"{_options.EffectiveEndpoint.TrimEnd('/')}/{path}";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        PropertyNameCaseInsensitive = true
    };

    private sealed class EmbeddingRequest
    {
        [JsonPropertyName("model")] public string Model { get; set; } = string.Empty;
        [JsonPropertyName("input")] public List<string> Input { get; set; } = new();
    }

    private sealed class EmbeddingResponse
    {
        [JsonPropertyName("data")] public List<EmbeddingData>? Data { get; set; }
    }

    private sealed class EmbeddingData
    {
        [JsonPropertyName("index")] public int Index { get; set; }
        [JsonPropertyName("embedding")] public float[]? Embedding { get; set; }
    }
}
