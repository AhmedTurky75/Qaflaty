namespace Qaflaty.Application.Common.Interfaces.Ai;

/// <summary>
/// Splits an uploaded document's extracted plain text into overlapping, embed-sized chunks.
/// Derived knowledge is already chunk-sized and does not go through this.
/// </summary>
public interface IDocumentChunker
{
    IReadOnlyList<string> Chunk(string text);
}
