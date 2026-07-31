using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.Downsell;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class DownsellOfferRepository : IDownsellOfferRepository
{
    private readonly QaflatyDbContext _context;

    public DownsellOfferRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task<DownsellOffer?> GetByProductIdAsync(ProductId productId, CancellationToken ct = default)
        => await _context.DownsellOffers.FirstOrDefaultAsync(o => o.ProductId == productId, ct);

    public async Task AddAsync(DownsellOffer offer, CancellationToken ct = default)
        => await _context.DownsellOffers.AddAsync(offer, ct);

    public void Update(DownsellOffer offer)
        => _context.DownsellOffers.Update(offer);
}
