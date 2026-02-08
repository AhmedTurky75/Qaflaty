using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Exceptions;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Application.Ordering.Queries.GetCustomerById;

public class GetCustomerByIdQueryHandler : IQueryHandler<GetCustomerByIdQuery, CustomerDto>
{
    private readonly ICustomerRepository _customerRepository;
    private readonly IOrderRepository _orderRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetCustomerByIdQueryHandler(
        ICustomerRepository customerRepository,
        IOrderRepository orderRepository,
        IStoreRepository storeRepository,
        ICurrentUserService currentUserService)
    {
        _customerRepository = customerRepository;
        _orderRepository = orderRepository;
        _storeRepository = storeRepository;
        _currentUserService = currentUserService;
    }

    public async Task<CustomerDto> Handle(GetCustomerByIdQuery request, CancellationToken cancellationToken)
    {
        var customerId = new CustomerId(request.CustomerId);
        var customer = await _customerRepository.GetByIdAsync(customerId, cancellationToken);
        if (customer == null)
            throw new NotFoundException("Customer", request.CustomerId);

        var store = await _storeRepository.GetByIdAsync(customer.StoreId, cancellationToken);
        if (store == null || store.MerchantId.Value != _currentUserService.MerchantId?.Value)
            throw new UnauthorizedAccessException("You don't have access to this customer");

        var orders = await _orderRepository.GetByCustomerIdAsync(customerId, cancellationToken);

        return new CustomerDto(
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
            orders.Count,
            customer.CreatedAt
        );
    }
}
