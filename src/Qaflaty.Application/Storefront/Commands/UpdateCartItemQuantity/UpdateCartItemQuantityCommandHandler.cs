using Qaflaty.Application.Analytics.Abstractions;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Storefront.Common;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Commands.UpdateCartItemQuantity;

public class UpdateCartItemQuantityCommandHandler : ICommandHandler<UpdateCartItemQuantityCommand>
{
    private readonly ICartRepository _cartRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantContext _tenantContext;
    private readonly IRealtimeNotifier _realtimeNotifier;

    public UpdateCartItemQuantityCommandHandler(
        ICartRepository cartRepository,
        IUnitOfWork unitOfWork,
        ITenantContext tenantContext,
        IRealtimeNotifier realtimeNotifier)
    {
        _cartRepository = cartRepository;
        _unitOfWork = unitOfWork;
        _tenantContext = tenantContext;
        _realtimeNotifier = realtimeNotifier;
    }

    public async Task<Result> Handle(UpdateCartItemQuantityCommand request, CancellationToken cancellationToken)
    {
        if (request.Quantity > 100)
            return Result.Failure(new Error("Cart.QuantityTooHigh", "Quantity cannot exceed 100 per item"));

        var cart = await CartOwnerResolver.ResolveExistingCartAsync(request.Owner, _cartRepository, cancellationToken);
        if (cart == null)
            return Result.Failure(new Error("Cart.NotFound", "Cart not found"));

        var result = cart.UpdateItemQuantity(new ProductId(request.ProductId), request.Quantity, request.VariantId);
        if (result.IsFailure) return result;

        _cartRepository.Update(cart);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        if (_tenantContext.CurrentStoreId.HasValue)
            await _realtimeNotifier.NotifyActiveCartsChangedAsync(_tenantContext.CurrentStoreId.Value, cancellationToken);

        return Result.Success();
    }
}
