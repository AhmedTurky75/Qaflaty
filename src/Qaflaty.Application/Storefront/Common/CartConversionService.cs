using Qaflaty.Application.Analytics.Abstractions;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Common;

public class CartConversionService : ICartConversionService
{
    private readonly ICartRepository _cartRepository;
    private readonly IRealtimeNotifier _realtimeNotifier;

    public CartConversionService(ICartRepository cartRepository, IRealtimeNotifier realtimeNotifier)
    {
        _cartRepository = cartRepository;
        _realtimeNotifier = realtimeNotifier;
    }

    public async Task ConvertCartAsync(StoreId storeId, Guid? buyerCustomerId, string? buyerGuestId, CancellationToken ct)
    {
        var cart = buyerCustomerId.HasValue
            ? await _cartRepository.GetByCustomerIdAsync(new StoreCustomerId(buyerCustomerId.Value), ct)
            : !string.IsNullOrWhiteSpace(buyerGuestId)
                ? await _cartRepository.GetByGuestIdAsync(buyerGuestId, storeId, ct)
                : null;

        if (cart == null)
            return;

        _cartRepository.Delete(cart);
        await _realtimeNotifier.NotifyActiveCartsChangedAsync(storeId, ct);
    }
}
