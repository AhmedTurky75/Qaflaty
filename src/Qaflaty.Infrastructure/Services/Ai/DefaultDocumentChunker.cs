using System.Text;
using Qaflaty.Application.Common.Interfaces.Ai;

namespace Qaflaty.Infrastructure.Services.Ai;

/// <summary>
/// Paragraph-aware, word-window chunker with overlap. Paragraphs (blank-line separated) are packed
/// into chunks up to <see cref="MaxWords"/>; a paragraph longer than that is hard-split. Each chunk
/// after the first repeats the last <see cref="OverlapWords"/> words of the previous one so context
/// spanning a boundary is not lost at retrieval time. Word count is a cheap proxy for token count.
/// </summary>
public sealed class DefaultDocumentChunker : IDocumentChunker
{
    private const int MaxWords = 350;      // ~500 tokens for typical prose
    private const int OverlapWords = 60;   // ~15% overlap

    public IReadOnlyList<string> Chunk(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return Array.Empty<string>();

        var paragraphs = SplitParagraphs(text);
        var chunks = new List<string>();
        var current = new List<string>(); // words in the chunk being built

        foreach (var paragraph in paragraphs)
        {
            var words = paragraph.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
            if (words.Length == 0)
                continue;

            // A single oversized paragraph is hard-split into windows.
            if (words.Length > MaxWords)
            {
                FlushCurrent(chunks, current);
                current.Clear();
                AddHardSplit(chunks, words);
                continue;
            }

            if (current.Count + words.Length > MaxWords && current.Count > 0)
            {
                FlushCurrent(chunks, current);
                var carry = TakeOverlap(current);
                current = new List<string>(carry);
            }

            current.AddRange(words);
        }

        FlushCurrent(chunks, current);
        return chunks;
    }

    private static void AddHardSplit(List<string> chunks, string[] words)
    {
        var step = MaxWords - OverlapWords;
        for (var start = 0; start < words.Length; start += step)
        {
            var window = words.Skip(start).Take(MaxWords).ToArray();
            chunks.Add(string.Join(' ', window));
            if (start + MaxWords >= words.Length)
                break;
        }
    }

    private static void FlushCurrent(List<string> chunks, List<string> current)
    {
        if (current.Count > 0)
            chunks.Add(string.Join(' ', current));
    }

    private static IEnumerable<string> TakeOverlap(List<string> words)
    {
        var take = Math.Min(OverlapWords, words.Count);
        return words.Skip(words.Count - take);
    }

    private static IEnumerable<string> SplitParagraphs(string text)
    {
        var normalized = text.Replace("\r\n", "\n").Replace('\r', '\n');
        var builder = new StringBuilder();

        foreach (var line in normalized.Split('\n'))
        {
            if (string.IsNullOrWhiteSpace(line))
            {
                if (builder.Length > 0)
                {
                    yield return builder.ToString();
                    builder.Clear();
                }
            }
            else
            {
                if (builder.Length > 0)
                    builder.Append(' ');
                builder.Append(line.Trim());
            }
        }

        if (builder.Length > 0)
            yield return builder.ToString();
    }
}
