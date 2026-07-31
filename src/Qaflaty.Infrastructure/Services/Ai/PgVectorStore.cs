using System.Data;
using System.Globalization;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Pgvector;
using Qaflaty.Application.Common.Interfaces.Ai;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Infrastructure.Persistence;
using Qaflaty.Infrastructure.Persistence.Records;

namespace Qaflaty.Infrastructure.Services.Ai;

/// <summary>
/// PostgreSQL + pgvector implementation of <see cref="IVectorStore"/>. All reads and writes are
/// filtered by <c>store_id</c> so a similarity search can never cross tenant boundaries. Similarity
/// search is a parameterized raw SQL query using the cosine-distance operator (<c>&lt;=&gt;</c>); the
/// blended product score (name-weighted) is computed in SQL to mirror the previous in-memory ranking.
/// </summary>
public sealed class PgVectorStore : IVectorStore
{
    // Product chunks carry a second name-only vector; the final score leans on the name so an
    // explicitly-named product outranks near-identical siblings while content still rewards context.
    private const double NameScoreWeight = 0.65;
    private const double ContentScoreWeight = 0.35;

    private readonly QaflatyDbContext _context;

    public PgVectorStore(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task ReplaceDocumentChunksAsync(
        StoreId storeId,
        KnowledgeDocumentId documentId,
        IReadOnlyList<VectorChunk> chunks,
        CancellationToken ct = default)
    {
        var storeGuid = storeId.Value;
        var docGuid = documentId.Value;

        // Delete-then-insert. Both are tenant-scoped so a document from another store can never be touched.
        await _context.KnowledgeChunks
            .Where(c => c.StoreId == storeGuid && c.DocumentId == docGuid)
            .ExecuteDeleteAsync(ct);

        if (chunks.Count == 0)
            return;

        var records = chunks.Select(chunk => new KnowledgeChunkRecord
        {
            Id = Guid.NewGuid(),
            DocumentId = docGuid,
            StoreId = storeGuid,
            ChunkIndex = chunk.ChunkIndex,
            DocType = chunk.DocType,
            Title = chunk.Title,
            Content = chunk.Content,
            Embedding = new Vector(chunk.Embedding),
            NameEmbedding = chunk.NameEmbedding is { Length: > 0 } name ? new Vector(name) : null,
            MetadataJson = chunk.Metadata is null ? null : JsonSerializer.Serialize(chunk.Metadata)
        }).ToList();

        await _context.KnowledgeChunks.AddRangeAsync(records, ct);
        await _context.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<VectorSearchHit>> SearchAsync(
        StoreId storeId,
        float[] queryEmbedding,
        int topK = 5,
        double minScore = 0.2,
        CancellationToken ct = default)
    {
        if (queryEmbedding.Length == 0 || topK <= 0)
            return Array.Empty<VectorSearchHit>();

        var queryVector = ToVectorLiteral(queryEmbedding);

        const string sql = @"
SELECT document_id, doc_type, title, content, metadata, score
FROM (
    SELECT document_id, doc_type, title, content, metadata,
        CASE WHEN name_embedding IS NULL
             THEN 1 - (embedding <=> @q::vector)
             ELSE @nameWeight * (1 - (name_embedding <=> @q::vector))
                + @contentWeight * (1 - (embedding <=> @q::vector))
        END AS score
    FROM knowledge_chunks
    WHERE store_id = @storeId
) t
WHERE t.score >= @minScore
ORDER BY t.score DESC
LIMIT @topK;";

        var connection = _context.Database.GetDbConnection();
        await _context.Database.OpenConnectionAsync(ct);
        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = sql;
            AddParameter(command, "q", queryVector);
            AddParameter(command, "storeId", storeId.Value);
            AddParameter(command, "nameWeight", NameScoreWeight);
            AddParameter(command, "contentWeight", ContentScoreWeight);
            AddParameter(command, "minScore", minScore);
            AddParameter(command, "topK", topK);

            var hits = new List<VectorSearchHit>();
            await using var reader = await command.ExecuteReaderAsync(ct);
            while (await reader.ReadAsync(ct))
            {
                var documentId = new KnowledgeDocumentId(reader.GetGuid(0));
                var docType = reader.GetString(1);
                var title = reader.GetString(2);
                var content = reader.GetString(3);
                var metadata = reader.IsDBNull(4) ? null : DeserializeMetadata(reader.GetString(4));
                var score = reader.GetDouble(5);

                hits.Add(new VectorSearchHit(documentId, docType, title, content, metadata, score));
            }

            return hits;
        }
        finally
        {
            await _context.Database.CloseConnectionAsync();
        }
    }

    public async Task DeleteDocumentChunksAsync(
        StoreId storeId, KnowledgeDocumentId documentId, CancellationToken ct = default)
    {
        var storeGuid = storeId.Value;
        var docGuid = documentId.Value;
        await _context.KnowledgeChunks
            .Where(c => c.StoreId == storeGuid && c.DocumentId == docGuid)
            .ExecuteDeleteAsync(ct);
    }

    public async Task DeleteStoreAsync(StoreId storeId, CancellationToken ct = default)
    {
        var storeGuid = storeId.Value;
        await _context.KnowledgeChunks
            .Where(c => c.StoreId == storeGuid)
            .ExecuteDeleteAsync(ct);
    }

    public async Task<VectorStoreStats> GetStatsAsync(StoreId storeId, CancellationToken ct = default)
    {
        var storeGuid = storeId.Value;

        var groups = await _context.KnowledgeChunks
            .Where(c => c.StoreId == storeGuid)
            .GroupBy(c => c.DocType)
            .Select(g => new { DocType = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        if (groups.Count == 0)
            return new VectorStoreStats(0, 0, 0, 0, 0, null);

        int CountOf(string docType) => groups.FirstOrDefault(g => g.DocType == docType)?.Count ?? 0;

        var lastUpdated = await _context.KnowledgeChunks
            .Where(c => c.StoreId == storeGuid)
            .MaxAsync(c => (DateTime?)c.CreatedAt, ct);

        return new VectorStoreStats(
            CountOf(AiKnowledgeDocumentType.Product),
            CountOf(AiKnowledgeDocumentType.Faq),
            CountOf(AiKnowledgeDocumentType.Store),
            CountOf(AiKnowledgeDocumentType.Upload),
            groups.Sum(g => g.Count),
            lastUpdated);
    }

    private static IReadOnlyDictionary<string, string>? DeserializeMetadata(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, string>>(json);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static string ToVectorLiteral(float[] embedding)
    {
        var sb = new StringBuilder(embedding.Length * 8 + 2);
        sb.Append('[');
        for (var i = 0; i < embedding.Length; i++)
        {
            if (i > 0)
                sb.Append(',');
            sb.Append(embedding[i].ToString("R", CultureInfo.InvariantCulture));
        }
        sb.Append(']');
        return sb.ToString();
    }

    private static void AddParameter(IDbCommand command, string name, object value)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value;
        command.Parameters.Add(parameter);
    }
}
