using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Catalog.Aggregates.PromoCode;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Enums;
using Qaflaty.Domain.Ordering.Errors;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Application.Ordering.Commands.ReleaseBlockedOrder;

public class ReleaseBlockedOrderCommandHandler : ICommandHandler<ReleaseBlockedOrderCommand>
{
    private readonly IOrderRepository _orderRepository;
    private readonly ICustomerRepository _customerRepository;
    private readonly IBlockedPhoneRepository _blockedPhoneRepository;
    private readonly IPromoCodeRepository _promoCodeRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;

    public ReleaseBlockedOrderCommandHandler(
        IOrderRepository orderRepository,
        ICustomerRepository customerRepository,
        IBlockedPhoneRepository blockedPhoneRepository,
        IPromoCodeRepository promoCodeRepository,
        IStoreRepository storeRepository,
        ICurrentUserService currentUserService)
    {
        _orderRepository = orderRepository;
        _customerRepository = customerRepository;
        _blockedPhoneRepository = blockedPhoneRepository;
        _promoCodeRepository = promoCodeRepository;
        _storeRepository = storeRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result> Handle(ReleaseBlockedOrderCommand request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);

        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        if (store == null ||
            !await _storeRepository.CanMerchantAccessStoreAsync(
                _currentUserService.MerchantId ?? default, store.Id, cancellationToken))
            return Result.Failure(Error.Unauthorized);

        var order = await _orderRepository.GetByIdAsync(new OrderId(request.OrderId), cancellationToken);
        if (order == null || order.StoreId != storeId)
            return Result.Failure(OrderingErrors.OrderNotFound);

        if (order.Status != OrderStatus.Blocked)
            return Result.Failure(OrderingErrors.OrderNotBlocked);

        var customer = await _customerRepository.GetByIdAsync(order.CustomerId, cancellationToken);

        // Confirming here raises OrderConfirmedEvent + OrderPlacedEvent, so stock is reserved and
        // the Purchase is tracked now — the point at which the order actually becomes real.
        var releaseResult = order.ReleaseFromBlock(_currentUserService.Email ?? "System");
        if (releaseResult.IsFailure)
            return releaseResult;

        _orderRepository.Update(order);

        // Placement deliberately skipped the promo redemption for a blocked order. Now that it is
        // confirmed, record it so usage limits stay accurate. A promo that has since been deleted
        // must not stop the merchant releasing the order — the discount is already in its pricing.
        if (!string.IsNullOrWhiteSpace(order.AppliedPromoCode) && customer != null)
        {
            var promo = await _promoCodeRepository.GetByCodeAsync(storeId, order.AppliedPromoCode, cancellationToken);
            if (promo != null)
            {
                promo.RecordRedemption();
                _promoCodeRepository.Update(promo);

                var redemption = PromoCodeRedemption.Create(
                    promo.Id,
                    storeId,
                    order.Id,
                    customer.Id,
                    promo.Code,
                    order.Pricing.DiscountAmount.Amount);

                await _promoCodeRepository.AddRedemptionAsync(redemption, cancellationToken);
            }
        }

        if (request.AlsoUnblockPhone && customer != null)
        {
            var blocked = await _blockedPhoneRepository.GetByPhoneAsync(
                storeId, customer.Contact.Phone, cancellationToken);

            if (blocked != null)
                _blockedPhoneRepository.Remove(blocked);
        }

        return Result.Success();
    }
}
