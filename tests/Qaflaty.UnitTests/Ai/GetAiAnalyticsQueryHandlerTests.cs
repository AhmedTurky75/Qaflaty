using Qaflaty.Application.Ai.Queries.GetAiAnalytics;
using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Aggregates.AiInteraction;
using Xunit;

namespace Qaflaty.UnitTests.Ai;

public class GetAiAnalyticsQueryHandlerTests
{
    [Fact]
    public async Task Handle_AggregatesInteractionLogsIntoDashboardMetrics()
    {
        var storeGuid = Guid.NewGuid();
        var storeId = StoreId.From(storeGuid);
        var conv1 = new ChatConversationId(Guid.NewGuid());
        var conv2 = new ChatConversationId(Guid.NewGuid());
        var productGuid = Guid.NewGuid();

        var logs = new List<AiInteractionLog>
        {
            AiInteractionLog.Reply(storeId, conv1, "Where is my order", documentsRetrieved: 3),
            AiInteractionLog.Reply(storeId, conv1, "Do you have laptops", documentsRetrieved: 0), // knowledge gap
            AiInteractionLog.Reply(storeId, conv2, "Do you have laptops", documentsRetrieved: 2),
            AiInteractionLog.ProductSuggested(storeId, conv2, productGuid),
            AiInteractionLog.ProductSuggested(storeId, conv2, productGuid),
            AiInteractionLog.CartAdd(storeId, conv2, productGuid),
            AiInteractionLog.OrderPlaced(storeId, conv2),
        };

        var handler = new GetAiAnalyticsQueryHandler(
            new FakeLogRepository(logs),
            new FakeProductRepository());

        var result = await handler.Handle(new GetAiAnalyticsQuery(storeGuid), CancellationToken.None);

        Assert.True(result.IsSuccess);
        var dto = result.Value;

        Assert.Equal(2, dto.ConversationsLast30Days);
        Assert.Equal(2, dto.ConversationsToday);
        Assert.Equal(3, dto.RepliesTotal);
        Assert.Equal(2, dto.ProductsRecommended);
        Assert.Equal(1, dto.CartAdditions);
        Assert.Equal(1, dto.OrdersPlaced);
        Assert.Equal(1, dto.KnowledgeGaps);
        Assert.Equal(0.5, dto.ConversionRate); // 1 cart add / 2 conversations

        // Most-asked question first
        Assert.Equal("Do you have laptops", dto.TopQuestions[0].Question);
        Assert.Equal(2, dto.TopQuestions[0].Count);

        // Unanswered question surfaced as a knowledge gap
        Assert.Contains("Do you have laptops", dto.KnowledgeGapQuestions);

        // Product interest grouped by product; name falls back when product is missing
        Assert.Single(dto.ProductInterest);
        Assert.Equal(productGuid, dto.ProductInterest[0].ProductId);
        Assert.Equal(2, dto.ProductInterest[0].Count);
    }

    [Fact]
    public async Task Handle_WithNoLogs_ReturnsZeroedMetrics()
    {
        var handler = new GetAiAnalyticsQueryHandler(
            new FakeLogRepository(new List<AiInteractionLog>()),
            new FakeProductRepository());

        var result = await handler.Handle(new GetAiAnalyticsQuery(Guid.NewGuid()), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(0, result.Value.ConversationsLast30Days);
        Assert.Equal(0, result.Value.OrdersPlaced);
        Assert.Equal(0d, result.Value.ConversionRate);
        Assert.Empty(result.Value.TopQuestions);
        Assert.Empty(result.Value.ProductInterest);
    }

    private sealed class FakeLogRepository : IAiInteractionLogRepository
    {
        private readonly IReadOnlyList<AiInteractionLog> _logs;
        public FakeLogRepository(IReadOnlyList<AiInteractionLog> logs) => _logs = logs;

        public Task AddAsync(AiInteractionLog log, CancellationToken ct = default) => Task.CompletedTask;
        public Task AddRangeAsync(IEnumerable<AiInteractionLog> logs, CancellationToken ct = default) => Task.CompletedTask;

        public Task<IReadOnlyList<AiInteractionLog>> GetByStoreSinceAsync(
            StoreId storeId, DateTime sinceUtc, CancellationToken ct = default) => Task.FromResult(_logs);
    }

    private sealed class FakeProductRepository : IProductRepository
    {
        public Task<Product?> GetByIdAsync(ProductId id, CancellationToken ct = default) =>
            Task.FromResult<Product?>(null);

        public Task<Product?> GetByIdWithPropertyValuesAsync(ProductId id, CancellationToken ct = default) =>
            Task.FromResult<Product?>(null);

        public Task<Product?> GetBySlugAsync(StoreId storeId, ProductSlug slug, CancellationToken ct = default) =>
            Task.FromResult<Product?>(null);

        public Task<IReadOnlyList<Product>> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default) =>
            throw new NotSupportedException();

        public Task<IReadOnlyList<Product>> GetByStoreIdWithPropertyValuesAsync(StoreId storeId, CancellationToken ct = default) =>
            throw new NotSupportedException();

        public Task<IReadOnlyList<Product>> GetByStoreIdWithVariantsAsync(StoreId storeId, CancellationToken ct = default) =>
            throw new NotSupportedException();

        public Task<bool> IsSlugAvailableAsync(StoreId storeId, ProductSlug slug, ProductId? excludeId = null, CancellationToken ct = default) =>
            throw new NotSupportedException();

        public Task AddAsync(Product product, CancellationToken ct = default) => throw new NotSupportedException();
        public void Update(Product product) => throw new NotSupportedException();
        public void Delete(Product product) => throw new NotSupportedException();
    }
}
