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

    public async Task<float[]> GenerateEmbeddingAsync(
        string input,
        AiEmbeddingInputType inputType = AiEmbeddingInputType.Document,
        CancellationToken cancellationToken = default)
    {
        var result = await GenerateEmbeddingsAsync(new[] { input }, inputType, cancellationToken);
        return result.Count > 0 ? result[0] : Array.Empty<float>();
    }

    public async Task<IReadOnlyList<float[]>> GenerateEmbeddingsAsync(
        IReadOnlyList<string> inputs,
        AiEmbeddingInputType inputType = AiEmbeddingInputType.Document,
        CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
            throw new InvalidOperationException("AI embedding endpoint is not configured.");

        if (inputs.Count == 0)
            return Array.Empty<float[]>();

        var model = _options.EffectiveEmbeddingModel;
        var request = new EmbeddingRequest
        {
            Model = model,
            Input = inputs.Select(text => ApplyTaskPrefix(model, inputType, text)).ToList()
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

    /// <summary>
    /// nomic-embed-text is asymmetric and is trained with mandatory task-instruction prefixes:
    /// documents must be prefixed with "search_document: " and queries with "search_query: ".
    /// Without them, query and document vectors do not share a retrieval space and cosine
    /// similarity returns semantically-wrong matches. Other models (OpenAI, all-minilm, bge, …)
    /// use different or no prefixes, so this is scoped to nomic models only.
    /// </summary>
    private static string ApplyTaskPrefix(string model, AiEmbeddingInputType inputType, string text)
    {
        if (model.IndexOf("nomic", StringComparison.OrdinalIgnoreCase) < 0)
            return text;

        return inputType == AiEmbeddingInputType.Query
            ? $"search_query: {text}"
            : $"search_document: {text}";
    }

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
