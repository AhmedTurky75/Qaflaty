using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.Downsell;

namespace Qaflaty.Domain.Storefront.Repositories;

public interface IDownsellOfferRepository
{
    Task<DownsellOffer?> GetByProductIdAsync(ProductId productId, CancellationToken ct = default);
    Task AddAsync(DownsellOffer offer, CancellationToken ct = default);
    void Update(DownsellOffer offer);
}
