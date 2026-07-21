using Qaflaty.Application.Analytics.Abstractions;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Storefront.Common;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Commands.ClearCart;

public class ClearCartCommandHandler : ICommandHandler<ClearCartCommand>
{
    private readonly ICartRepository _cartRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantContext _tenantContext;
    private readonly IRealtimeNotifier _realtimeNotifier;

    public ClearCartCommandHandler(
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

    public async Task<Result> Handle(ClearCartCommand request, CancellationToken cancellationToken)
    {
        var cart = await CartOwnerResolver.ResolveExistingCartAsync(request.Owner, _cartRepository, cancellationToken);
        if (cart == null) return Result.Success(); // Nothing to clear

        cart.ClearAll();
        _cartRepository.Update(cart);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        if (_tenantContext.CurrentStoreId.HasValue)
            await _realtimeNotifier.NotifyActiveCartsChangedAsync(_tenantContext.CurrentStoreId.Value, cancellationToken);

        return Result.Success();
    }
}
