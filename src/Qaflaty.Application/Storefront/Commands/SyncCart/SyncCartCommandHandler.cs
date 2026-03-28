using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Storefront.Common;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Commands.SyncCart;

public class SyncCartCommandHandler : ICommandHandler<SyncCartCommand>
{
    private readonly ICartRepository _cartRepository;
    private readonly ITenantContext _tenantContext;

    public SyncCartCommandHandler(ICartRepository cartRepository, ITenantContext tenantContext)
    {
        _cartRepository = cartRepository;
        _tenantContext = tenantContext;
    }

    public async Task<Result> Handle(SyncCartCommand request, CancellationToken cancellationToken)
    {
        // Get or create the authenticated customer's cart
        var cart = await CartOwnerResolver.ResolveOrCreateCartAsync(request.Owner, _cartRepository, cancellationToken);

        // Merge server-side guest cart if a guest session ID was provided
        if (!string.IsNullOrWhiteSpace(request.GuestSessionId) && _tenantContext.CurrentStoreId.HasValue)
        {
            var guestCart = await _cartRepository.GetByGuestIdAsync(
                request.GuestSessionId,
                _tenantContext.CurrentStoreId.Value,
                cancellationToken);

            if (guestCart != null)
            {
                var guestItems = guestCart.Items
                    .Select(i => (i.ProductId, i.VariantId, i.Quantity))
                    .ToList();

                cart.MergeGuestCart(guestItems);
                _cartRepository.Delete(guestCart);
            }
        }

        // Merge localStorage items sent from the frontend
        if (request.GuestItems.Any())
        {
            var localItems = request.GuestItems
                .Select(gi => (new ProductId(gi.ProductId), gi.VariantId, gi.Quantity))
                .ToList();

            var mergeResult = cart.MergeGuestCart(localItems);
            if (mergeResult.IsFailure)
                return Result.Failure(mergeResult.Error);
        }

        return Result.Success();
    }
}
