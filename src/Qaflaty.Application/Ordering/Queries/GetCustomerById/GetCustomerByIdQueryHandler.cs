using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Ordering.Enums;
using Qaflaty.Domain.Ordering.Errors;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Application.Ordering.Queries.GetCustomerById;

public class GetCustomerByIdQueryHandler : IQueryHandler<GetCustomerByIdQuery, CustomerDto>
{
    private readonly ICustomerRepository _customerRepository;
    private readonly IOrderRepository _orderRepository;
    private readonly IBlockedPhoneRepository _blockedPhoneRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetCustomerByIdQueryHandler(
        ICustomerRepository customerRepository,
        IOrderRepository orderRepository,
        IBlockedPhoneRepository blockedPhoneRepository,
        IStoreRepository storeRepository,
        ICurrentUserService currentUserService)
    {
        _customerRepository = customerRepository;
        _orderRepository = orderRepository;
        _blockedPhoneRepository = blockedPhoneRepository;
        _storeRepository = storeRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result<CustomerDto>> Handle(GetCustomerByIdQuery request, CancellationToken cancellationToken)
    {
        var customerId = new CustomerId(request.CustomerId);
        var customer = await _customerRepository.GetByIdAsync(customerId, cancellationToken);
        if (customer == null)
            return Result.Failure<CustomerDto>(OrderingErrors.CustomerNotFound);

        var store = await _storeRepository.GetByIdAsync(customer.StoreId, cancellationToken);
        if (store == null ||
            !await _storeRepository.CanMerchantAccessStoreAsync(
                _currentUserService.MerchantId ?? default, store.Id, cancellationToken))
            return Result.Failure<CustomerDto>(Error.Unauthorized);

        var orders = await _orderRepository.GetByCustomerIdAsync(customerId, cancellationToken);

        // Orders held against the phone blocklist are not counted: the merchant has not accepted
        // them, so they must not inflate the customer's history.
        var countedOrders = orders.Where(o => o.Status != OrderStatus.Blocked).ToList();

        var totalSpent = countedOrders
            .Where(o => o.Status != OrderStatus.Cancelled)
            .Sum(o => o.Pricing.Total.Amount);

        var blockedPhone = await _blockedPhoneRepository.GetByPhoneAsync(
            customer.StoreId, customer.Contact.Phone, cancellationToken);

        return Result.Success(new CustomerDto(
            customer.Id.Value,
            customer.StoreId.Value,
            customer.Contact.FullName.Value,
            customer.Contact.Phone.Value,
            customer.Contact.Email?.Value,
            customer.Address.Street,
            customer.Address.City,
            customer.Address.District,
            customer.Address.PostalCode,
            customer.Address.Country,
            customer.Notes,
            countedOrders.Count,
            totalSpent,
            countedOrders.Count == 0 ? null : countedOrders.Min(o => o.CreatedAt),
            countedOrders.Count == 0 ? null : countedOrders.Max(o => o.CreatedAt),
            customer.CreatedAt,
            blockedPhone?.Id.Value,
            blockedPhone?.Reason,
            blockedPhone?.BlockedAt
        ));
    }
}
