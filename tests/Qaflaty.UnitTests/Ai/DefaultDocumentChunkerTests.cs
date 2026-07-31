using System;
using System.Linq;
using Qaflaty.Infrastructure.Services.Ai;
using Xunit;

namespace Qaflaty.UnitTests.Ai;

public class DefaultDocumentChunkerTests
{
    private readonly DefaultDocumentChunker _chunker = new();

    [Fact]
    public void Chunk_EmptyOrWhitespace_ReturnsNoChunks()
    {
        Assert.Empty(_chunker.Chunk(""));
        Assert.Empty(_chunker.Chunk("   \n\n  "));
    }

    [Fact]
    public void Chunk_ShortText_ReturnsSingleChunk()
    {
        var chunks = _chunker.Chunk("A short paragraph about a product.");

        Assert.Single(chunks);
        Assert.Contains("short paragraph", chunks[0]);
    }

    [Fact]
    public void Chunk_LongText_SplitsIntoMultipleOverlappingChunks()
    {
        // ~1200 words across one big paragraph forces several windows.
        var words = string.Join(' ', Enumerable.Range(0, 1200).Select(i => $"w{i}"));

        var chunks = _chunker.Chunk(words);

        Assert.True(chunks.Count > 1);
        // Overlap: the end of one chunk should reappear at the start of the next.
        var firstWords = chunks[0].Split(' ');
        var secondWords = chunks[1].Split(' ');
        Assert.Contains(firstWords[^1], secondWords);
    }

    [Fact]
    public void Chunk_KeepsParagraphsTogetherWhenTheyFit()
    {
        var text = "First paragraph about shipping.\n\nSecond paragraph about returns.";

        var chunks = _chunker.Chunk(text);

        Assert.Single(chunks);
        Assert.Contains("shipping", chunks[0]);
        Assert.Contains("returns", chunks[0]);
    }
}
