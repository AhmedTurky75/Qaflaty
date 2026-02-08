using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Common.Models;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Application.Ordering.Queries.GetStoreCustomers;

public class GetStoreCustomersQueryHandler : IQueryHandler<GetStoreCustomersQuery, PaginatedList<CustomerListDto>>
{
    private readonly ICustomerRepository _customerRepository;
    private readonly IOrderRepository _orderRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetStoreCustomersQueryHandler(
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

    public async Task<PaginatedList<CustomerListDto>> Handle(GetStoreCustomersQuery request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);

        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        if (store == null || store.MerchantId.Value != _currentUserService.MerchantId?.Value)
            throw new UnauthorizedAccessException("You don't have access to this store");

        var customers = await _customerRepository.GetByStoreIdAsync(storeId, cancellationToken);
        var orders = await _orderRepository.GetByStoreIdAsync(storeId, cancellationToken);

        var orderCountByCustomer = orders
            .GroupBy(o => o.CustomerId.Value)
            .ToDictionary(g => g.Key, g => g.Count());

        var query = customers.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            query = query.Where(c =>
                c.Contact.FullName.Value.Contains(request.SearchTerm, StringComparison.OrdinalIgnoreCase) ||
                c.Contact.Phone.Value.Contains(request.SearchTerm, StringComparison.OrdinalIgnoreCase) ||
                (c.Contact.Email?.Value.Contains(request.SearchTerm, StringComparison.OrdinalIgnoreCase) ?? false));
        }

        query = query.OrderByDescending(c => c.CreatedAt);

        var dtos = query.Select(c => new CustomerListDto(
            c.Id.Value,
            c.Contact.FullName.Value,
            c.Contact.Phone.Value,
            c.Contact.Email?.Value,
            c.Address.City,
            orderCountByCustomer.GetValueOrDefault(c.Id.Value, 0),
            c.CreatedAt
        ));

        return PaginatedList<CustomerListDto>.Create(dtos, request.PageNumber, request.PageSize);
    }
}
