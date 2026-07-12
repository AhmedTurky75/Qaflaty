namespace Qaflaty.Application.Common.Interfaces.Ai;

/// <summary>
/// Extracts plain text from an uploaded knowledge document. Implementations decide which content
/// types they support (plain text, markdown, PDF, …).
/// </summary>
public interface IDocumentTextExtractor
{
    /// <summary>True when this extractor can handle the given content type / file extension.</summary>
    bool CanExtract(string contentType, string fileName);

    Task<string> ExtractTextAsync(
        Stream content, string contentType, string fileName, CancellationToken ct = default);
}
