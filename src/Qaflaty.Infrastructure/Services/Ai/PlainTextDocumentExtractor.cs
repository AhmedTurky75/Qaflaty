using Qaflaty.Application.Common.Interfaces.Ai;

namespace Qaflaty.Infrastructure.Services.Ai;

/// <summary>
/// Extracts text from plain-text-family uploads (txt, markdown, csv, json). Binary formats such as
/// PDF/DOCX are not handled here — register an additional <see cref="IDocumentTextExtractor"/> that
/// depends on a parsing library to support them; unsupported uploads are marked Failed with a clear
/// message by the processor.
/// </summary>
public sealed class PlainTextDocumentExtractor : IDocumentTextExtractor
{
    private static readonly string[] SupportedExtensions = { ".txt", ".md", ".markdown", ".csv", ".json", ".log" };

    public bool CanExtract(string contentType, string fileName)
    {
        if (!string.IsNullOrWhiteSpace(contentType) &&
            contentType.StartsWith("text/", StringComparison.OrdinalIgnoreCase))
            return true;

        var extension = Path.GetExtension(fileName);
        return !string.IsNullOrEmpty(extension) &&
               SupportedExtensions.Contains(extension.ToLowerInvariant());
    }

    public async Task<string> ExtractTextAsync(
        Stream content, string contentType, string fileName, CancellationToken ct = default)
    {
        using var reader = new StreamReader(content, detectEncodingFromByteOrderMarks: true);
        return await reader.ReadToEndAsync(ct);
    }
}
