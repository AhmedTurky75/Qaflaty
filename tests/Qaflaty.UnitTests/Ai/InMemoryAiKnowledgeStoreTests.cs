using Qaflaty.Application.Common.Interfaces.Ai;
using Qaflaty.Infrastructure.Services.Ai;
using Xunit;

namespace Qaflaty.UnitTests.Ai;

public class InMemoryAiKnowledgeStoreTests
{
    private static AiKnowledgeDocument Doc(Guid storeId, string id, string type, float[] embedding) =>
        new(id, storeId, type, $"Title {id}", $"Content {id}", embedding);

    [Fact]
    public void Search_RanksByCosineSimilarity_AndAppliesMinScore()
    {
        var store = new InMemoryAiKnowledgeStore();
        var storeId = Guid.NewGuid();

        store.ReplaceStoreDocuments(storeId, new[]
        {
            Doc(storeId, "near", AiKnowledgeDocumentType.Product, new[] { 1f, 0f }),
            Doc(storeId, "mid", AiKnowledgeDocumentType.Faq, new[] { 0.9f, 0.1f }),
            Doc(storeId, "orthogonal", AiKnowledgeDocumentType.Store, new[] { 0f, 1f }),
        });

        var results = store.Search(storeId, new[] { 1f, 0f }, topK: 5, minScore: 0.2);

        // The orthogonal doc (score 0) is filtered out by minScore.
        Assert.Equal(2, results.Count);
        Assert.Equal("near", results[0].Document.Id);
        Assert.Equal("mid", results[1].Document.Id);
        Assert.True(results[0].Score >= results[1].Score);
    }

    [Fact]
    public void Search_RespectsTopK()
    {
        var store = new InMemoryAiKnowledgeStore();
        var storeId = Guid.NewGuid();
        store.ReplaceStoreDocuments(storeId, new[]
        {
            Doc(storeId, "a", AiKnowledgeDocumentType.Product, new[] { 1f, 0f }),
            Doc(storeId, "b", AiKnowledgeDocumentType.Product, new[] { 0.95f, 0.05f }),
            Doc(storeId, "c", AiKnowledgeDocumentType.Product, new[] { 0.9f, 0.1f }),
        });

        var results = store.Search(storeId, new[] { 1f, 0f }, topK: 2, minScore: 0.0);

        Assert.Equal(2, results.Count);
    }

    [Fact]
    public void Search_IsIsolatedPerStore()
    {
        var store = new InMemoryAiKnowledgeStore();
        var storeA = Guid.NewGuid();
        var storeB = Guid.NewGuid();

        store.ReplaceStoreDocuments(storeA, new[]
        {
            Doc(storeA, "a1", AiKnowledgeDocumentType.Product, new[] { 1f, 0f }),
        });

        Assert.True(store.HasKnowledge(storeA));
        Assert.False(store.HasKnowledge(storeB));
        Assert.Empty(store.Search(storeB, new[] { 1f, 0f }));
    }

    [Fact]
    public void ReplaceStoreDocuments_OverwritesPreviousKnowledge()
    {
        var store = new InMemoryAiKnowledgeStore();
        var storeId = Guid.NewGuid();

        store.ReplaceStoreDocuments(storeId, new[]
        {
            Doc(storeId, "old", AiKnowledgeDocumentType.Product, new[] { 1f, 0f }),
        });
        store.ReplaceStoreDocuments(storeId, new[]
        {
            Doc(storeId, "new", AiKnowledgeDocumentType.Faq, new[] { 1f, 0f }),
        });

        var results = store.Search(storeId, new[] { 1f, 0f }, minScore: 0.0);
        Assert.Single(results);
        Assert.Equal("new", results[0].Document.Id);
    }

    [Fact]
    public void GetStats_CountsDocumentsByType()
    {
        var store = new InMemoryAiKnowledgeStore();
        var storeId = Guid.NewGuid();
        store.ReplaceStoreDocuments(storeId, new[]
        {
            Doc(storeId, "p1", AiKnowledgeDocumentType.Product, new[] { 1f, 0f }),
            Doc(storeId, "p2", AiKnowledgeDocumentType.Product, new[] { 1f, 0f }),
            Doc(storeId, "f1", AiKnowledgeDocumentType.Faq, new[] { 1f, 0f }),
            Doc(storeId, "s1", AiKnowledgeDocumentType.Store, new[] { 1f, 0f }),
        });

        var stats = store.GetStats(storeId);

        Assert.NotNull(stats);
        Assert.Equal(2, stats!.ProductCount);
        Assert.Equal(1, stats.FaqCount);
        Assert.Equal(1, stats.StorePageCount);
        Assert.Equal(4, stats.TotalDocuments);
    }

    [Fact]
    public void Search_WithEmptyQueryEmbedding_ReturnsEmpty()
    {
        var store = new InMemoryAiKnowledgeStore();
        var storeId = Guid.NewGuid();
        store.ReplaceStoreDocuments(storeId, new[]
        {
            Doc(storeId, "a", AiKnowledgeDocumentType.Product, new[] { 1f, 0f }),
        });

        Assert.Empty(store.Search(storeId, Array.Empty<float>()));
    }
}
