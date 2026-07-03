using Qaflaty.Application.Catalog.Queries.GetStorefrontPaymentMethods;
using Qaflaty.Domain.Catalog.Aggregates.PaymentMethodDefinition;
using Qaflaty.Domain.Catalog.Aggregates.StoreConfiguration;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Identifiers;
using Xunit;

namespace Qaflaty.UnitTests.Application.Handlers;

public class GetStorefrontPaymentMethodsQueryHandlerTests
{
    [Fact]
    public async Task Handle_NoConfiguration_DefaultsToCodOnly()
    {
        var handler = new GetStorefrontPaymentMethodsQueryHandler(
            new FakeConfigRepo(config: null),
            new FakeDefinitionRepo([])); // no definitions -> fallback labels

        var result = await handler.Handle(
            new GetStorefrontPaymentMethodsQuery(Guid.NewGuid()), CancellationToken.None);

        Assert.True(result.IsSuccess);
        var method = Assert.Single(result.Value);
        Assert.Equal("COD", method.PaymentMethod);
        Assert.True(method.IsEnabled);
        Assert.Equal("Cash on Delivery", method.DefaultLabel); // fallback when no definition
    }

    private sealed class FakeConfigRepo : IStoreConfigurationRepository
    {
        private readonly StoreConfiguration? _config;
        public FakeConfigRepo(StoreConfiguration? config) => _config = config;

        public Task<StoreConfiguration?> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default)
            => Task.FromResult(_config);

        public Task<StoreConfiguration?> GetByIdAsync(StoreConfigurationId id, CancellationToken ct = default)
            => throw new NotSupportedException();
        public Task AddAsync(StoreConfiguration config, CancellationToken ct = default) => throw new NotSupportedException();
        public void Update(StoreConfiguration config) => throw new NotSupportedException();
    }

    private sealed class FakeDefinitionRepo : IPaymentMethodDefinitionRepository
    {
        private readonly List<PaymentMethodDefinition> _defs;
        public FakeDefinitionRepo(List<PaymentMethodDefinition> defs) => _defs = defs;

        public Task<List<PaymentMethodDefinition>> GetAllActiveAsync(CancellationToken cancellationToken)
            => Task.FromResult(_defs);
    }
}
