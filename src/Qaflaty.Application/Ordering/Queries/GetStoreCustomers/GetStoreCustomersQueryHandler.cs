using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Common.Models;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Ordering.Enums;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Application.Ordering.Queries.GetStoreCustomers;

public class GetStoreCustomersQueryHandler : IQueryHandler<GetStoreCustomersQuery, PaginatedList<CustomerListDto>>
{
    private readonly ICustomerRepository _customerRepository;
    private readonly IOrderRepository _orderRepository;
    private readonly IBlockedPhoneRepository _blockedPhoneRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetStoreCustomersQueryHandler(
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

    public async Task<Result<PaginatedList<CustomerListDto>>> Handle(GetStoreCustomersQuery request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);

        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        if (store == null ||
            !await _storeRepository.CanMerchantAccessStoreAsync(
                _currentUserService.MerchantId ?? default, store.Id, cancellationToken))
            return Result.Failure<PaginatedList<CustomerListDto>>(Error.Unauthorized);

        var customers = await _customerRepository.GetByStoreIdAsync(storeId, cancellationToken);
        var orders = await _orderRepository.GetByStoreIdAsync(storeId, cancellationToken);

        // One lookup for the store, keyed by E.164, so flagging blocked rows costs no extra queries.
        var blockedPhones = await _blockedPhoneRepository.GetByStoreIdAsync(storeId, cancellationToken);
        var blockedIdByPhone = blockedPhones.ToDictionary(b => b.Phone.Value, b => b.Id.Value);

        // Orders held against the phone blocklist are excluded: the merchant has not accepted them,
        // so they must not inflate a customer's history. Cancelled orders still count toward the
        // order tally and last-order date, but never toward spend.
        var statsByCustomer = orders
            .Where(o => o.Status != OrderStatus.Blocked)
            .GroupBy(o => o.CustomerId.Value)
            .ToDictionary(
                g => g.Key,
                g => (
                    Count: g.Count(),
                    TotalSpent: g.Where(o => o.Status != OrderStatus.Cancelled)
                                 .Sum(o => o.Pricing.Total.Amount),
                    LastOrderDate: (DateTime?)g.Max(o => o.CreatedAt)));

        var query = customers.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            query = query.Where(c =>
                c.Contact.FullName.Value.Contains(request.SearchTerm, StringComparison.OrdinalIgnoreCase) ||
                c.Contact.Phone.Value.Contains(request.SearchTerm, StringComparison.OrdinalIgnoreCase) ||
                (c.Contact.Email?.Value.Contains(request.SearchTerm, StringComparison.OrdinalIgnoreCase) ?? false));
        }

        query = query.OrderByDescending(c => c.CreatedAt);

        var dtos = query.Select(c =>
        {
            var stats = statsByCustomer.GetValueOrDefault(c.Id.Value, (Count: 0, TotalSpent: 0m, LastOrderDate: (DateTime?)null));
            return new CustomerListDto(
                c.Id.Value,
                c.Contact.FullName.Value,
                c.Contact.Phone.Value,
                c.Contact.Email?.Value,
                c.Address.City,
                stats.Count,
                stats.TotalSpent,
                stats.LastOrderDate,
                c.CreatedAt,
                blockedIdByPhone.TryGetValue(c.Contact.Phone.Value, out var blockedId) ? blockedId : null
            );
        });

        return Result.Success(PaginatedList<CustomerListDto>.Create(dtos, request.PageNumber, request.PageSize));
    }
}
