using System;
using System.Linq;
using System.Threading.Tasks;
using Qaflaty.Application.Common.Interfaces.Ai;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Infrastructure.Services.Ai;
using Xunit;

namespace Qaflaty.UnitTests.Ai;

public class InMemoryVectorStoreTests
{
    private static async Task<KnowledgeDocumentId> AddAsync(
        IVectorStore store,
        Guid storeId,
        string label,
        string docType,
        float[] embedding,
        float[]? nameEmbedding = null)
    {
        var documentId = KnowledgeDocumentId.New();
        var chunk = new VectorChunk(
            documentId, StoreId.From(storeId), 0, docType, label, $"Content {label}", embedding, nameEmbedding);
        await store.ReplaceDocumentChunksAsync(StoreId.From(storeId), documentId, new[] { chunk });
        return documentId;
    }

    [Fact]
    public async Task Search_RanksByCosineSimilarity_AndAppliesMinScore()
    {
        var store = new InMemoryVectorStore();
        var storeId = Guid.NewGuid();

        await AddAsync(store, storeId, "near", AiKnowledgeDocumentType.Product, new[] { 1f, 0f });
        await AddAsync(store, storeId, "mid", AiKnowledgeDocumentType.Faq, new[] { 0.9f, 0.1f });
        await AddAsync(store, storeId, "orthogonal", AiKnowledgeDocumentType.Store, new[] { 0f, 1f });

        var results = await store.SearchAsync(StoreId.From(storeId), new[] { 1f, 0f }, topK: 5, minScore: 0.2);

        // The orthogonal chunk (score 0) is filtered out by minScore.
        Assert.Equal(2, results.Count);
        Assert.Equal("near", results[0].Title);
        Assert.Equal("mid", results[1].Title);
        Assert.True(results[0].Score >= results[1].Score);
    }

    [Fact]
    public async Task Search_RespectsTopK()
    {
        var store = new InMemoryVectorStore();
        var storeId = Guid.NewGuid();

        await AddAsync(store, storeId, "a", AiKnowledgeDocumentType.Product, new[] { 1f, 0f });
        await AddAsync(store, storeId, "b", AiKnowledgeDocumentType.Product, new[] { 0.95f, 0.05f });
        await AddAsync(store, storeId, "c", AiKnowledgeDocumentType.Product, new[] { 0.9f, 0.1f });

        var results = await store.SearchAsync(StoreId.From(storeId), new[] { 1f, 0f }, topK: 2, minScore: 0.0);

        Assert.Equal(2, results.Count);
    }

    [Fact]
    public async Task Search_NeverReturnsAnotherTenantsVectors_EvenWhenMoreSimilar()
    {
        var store = new InMemoryVectorStore();
        var storeA = Guid.NewGuid();
        var storeB = Guid.NewGuid();

        // Store A's chunk is only a partial match; store B holds an *exact* match for the query.
        var aId = await AddAsync(store, storeA, "a1", AiKnowledgeDocumentType.Product, new[] { 0.8f, 0.2f });
        var bId = await AddAsync(store, storeB, "b1", AiKnowledgeDocumentType.Product, new[] { 1f, 0f });

        var results = await store.SearchAsync(StoreId.From(storeA), new[] { 1f, 0f }, topK: 5, minScore: 0.0);

        // Only store A's document may ever come back, despite B being a closer match.
        Assert.NotEmpty(results);
        Assert.All(results, r => Assert.Equal(aId, r.DocumentId));
        Assert.DoesNotContain(results, r => r.DocumentId == bId);
    }

    [Fact]
    public async Task Search_BlendsNameEmbedding_SoNamedProductOutranksContentOnlyMatch()
    {
        var store = new InMemoryVectorStore();
        var storeId = Guid.NewGuid();

        // Named product: content is orthogonal to the query, but its name vector matches exactly.
        // Blended score = 0.65*1 + 0.35*0 = 0.65.
        await AddAsync(store, storeId, "named", AiKnowledgeDocumentType.Product,
            embedding: new[] { 0f, 1f }, nameEmbedding: new[] { 1f, 0f });

        // Content-only product ~60° off the query → cosine 0.5.
        await AddAsync(store, storeId, "content", AiKnowledgeDocumentType.Product,
            new[] { 0.5f, 0.8660254f });

        var results = await store.SearchAsync(StoreId.From(storeId), new[] { 1f, 0f }, topK: 5, minScore: 0.0);

        Assert.Equal("named", results[0].Title);
    }

    [Fact]
    public async Task ReplaceDocumentChunks_OverwritesThatDocumentsChunks()
    {
        var store = new InMemoryVectorStore();
        var storeId = Guid.NewGuid();

        var documentId = await AddAsync(store, storeId, "old", AiKnowledgeDocumentType.Product, new[] { 1f, 0f });

        var replacement = new VectorChunk(
            documentId, StoreId.From(storeId), 0, AiKnowledgeDocumentType.Faq, "new", "Content new", new[] { 1f, 0f });
        await store.ReplaceDocumentChunksAsync(StoreId.From(storeId), documentId, new[] { replacement });

        var results = await store.SearchAsync(StoreId.From(storeId), new[] { 1f, 0f }, minScore: 0.0);
        Assert.Single(results);
        Assert.Equal("new", results[0].Title);
    }

    [Fact]
    public async Task GetStats_CountsChunksByType()
    {
        var store = new InMemoryVectorStore();
        var storeId = Guid.NewGuid();

        await AddAsync(store, storeId, "p1", AiKnowledgeDocumentType.Product, new[] { 1f, 0f });
        await AddAsync(store, storeId, "p2", AiKnowledgeDocumentType.Product, new[] { 1f, 0f });
        await AddAsync(store, storeId, "f1", AiKnowledgeDocumentType.Faq, new[] { 1f, 0f });
        await AddAsync(store, storeId, "s1", AiKnowledgeDocumentType.Store, new[] { 1f, 0f });
        await AddAsync(store, storeId, "u1", AiKnowledgeDocumentType.Upload, new[] { 1f, 0f });

        var stats = await store.GetStatsAsync(StoreId.From(storeId));

        Assert.Equal(2, stats.ProductCount);
        Assert.Equal(1, stats.FaqCount);
        Assert.Equal(1, stats.StorePageCount);
        Assert.Equal(1, stats.UploadCount);
        Assert.Equal(5, stats.TotalChunks);
    }

    [Fact]
    public async Task Search_WithEmptyQueryEmbedding_ReturnsEmpty()
    {
        var store = new InMemoryVectorStore();
        var storeId = Guid.NewGuid();
        await AddAsync(store, storeId, "a", AiKnowledgeDocumentType.Product, new[] { 1f, 0f });

        Assert.Empty(await store.SearchAsync(StoreId.From(storeId), Array.Empty<float>()));
    }

    [Fact]
    public async Task DeleteStore_RemovesAllOfThatStoresChunks()
    {
        var store = new InMemoryVectorStore();
        var storeId = Guid.NewGuid();
        await AddAsync(store, storeId, "a", AiKnowledgeDocumentType.Product, new[] { 1f, 0f });

        await store.DeleteStoreAsync(StoreId.From(storeId));

        Assert.Empty(await store.SearchAsync(StoreId.From(storeId), new[] { 1f, 0f }, minScore: 0.0));
    }
}
