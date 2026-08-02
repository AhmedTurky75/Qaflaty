using Qaflaty.Application.Catalog.Commands.EnsureLayoutPage;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Identifiers;
using Xunit;
using PageConfigurationAggregate = Qaflaty.Domain.Catalog.Aggregates.PageConfiguration.PageConfiguration;

namespace Qaflaty.UnitTests.Application.Handlers;

/// <summary>
/// The header and footer are page configurations of their own type. Stores
/// created before they existed get one on demand, which must not produce a
/// second group when the merchant opens the builder again.
/// </summary>
public class EnsureLayoutPageCommandHandlerTests
{
    private static readonly Guid StoreGuid = Guid.NewGuid();

    [Fact]
    public async Task Handle_WhenMissing_CreatesTheGroup()
    {
        var repo = new FakePageRepository();
        var handler = new EnsureLayoutPageCommandHandler(repo);

        var result = await handler.Handle(new EnsureLayoutPageCommand(StoreGuid, "Header"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("Header", result.Value.PageType);
        Assert.Equal("header", result.Value.Slug);
        Assert.Empty(result.Value.Sections);
        Assert.Single(repo.Added);
    }

    [Fact]
    public async Task Handle_WhenAlreadyThere_ReturnsItWithoutAddingAnother()
    {
        var existing = PageConfigurationAggregate.Create(
            new StoreId(StoreGuid),
            PageType.Footer,
            "footer",
            BilingualText.Create("التذييل", "Footer")).Value;
        existing.AddSection(SectionType.Copyright, "copyright-bar", true, 1);

        var repo = new FakePageRepository(existing);
        var handler = new EnsureLayoutPageCommandHandler(repo);

        var result = await handler.Handle(new EnsureLayoutPageCommand(StoreGuid, "Footer"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(existing.Id.Value, result.Value.Id);
        Assert.Single(result.Value.Sections);
        Assert.Empty(repo.Added);
    }

    [Theory]
    [InlineData("Home")]
    [InlineData("Custom")]
    [InlineData("NotAType")]
    public async Task Handle_ForAnythingButHeaderOrFooter_Fails(string layoutType)
    {
        var repo = new FakePageRepository();
        var handler = new EnsureLayoutPageCommandHandler(repo);

        var result = await handler.Handle(new EnsureLayoutPageCommand(StoreGuid, layoutType), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("PageConfiguration.InvalidLayoutType", result.Error.Code);
        Assert.Empty(repo.Added);
    }

    private sealed class FakePageRepository : IPageConfigurationRepository
    {
        private readonly List<PageConfigurationAggregate> _pages;

        public List<PageConfigurationAggregate> Added { get; } = [];

        public FakePageRepository(params PageConfigurationAggregate[] seed) => _pages = [.. seed];

        public Task<PageConfigurationAggregate?> GetByStoreIdAndTypeAsync(StoreId storeId, PageType pageType, CancellationToken ct = default)
            => Task.FromResult(_pages.FirstOrDefault(p => p.StoreId == storeId && p.PageType == pageType));

        public Task AddAsync(PageConfigurationAggregate page, CancellationToken ct = default)
        {
            Added.Add(page);
            _pages.Add(page);
            return Task.CompletedTask;
        }

        // Unused by the handler under test.
        public Task<PageConfigurationAggregate?> GetByIdAsync(PageConfigurationId id, CancellationToken ct = default)
            => throw new NotSupportedException();
        public Task<PageConfigurationAggregate?> GetByStoreIdAndSlugAsync(StoreId storeId, string slug, CancellationToken ct = default)
            => throw new NotSupportedException();
        public Task<PageConfigurationAggregate?> GetByProductIdAsync(ProductId productId, CancellationToken ct = default)
            => throw new NotSupportedException();
        public Task<IReadOnlyList<PageConfigurationAggregate>> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default)
            => throw new NotSupportedException();
        public void Update(PageConfigurationAggregate page) => throw new NotSupportedException();
        public void Delete(PageConfigurationAggregate page) => throw new NotSupportedException();
    }
}
