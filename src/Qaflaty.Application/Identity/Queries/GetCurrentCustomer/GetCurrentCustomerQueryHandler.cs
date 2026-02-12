using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Identity.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Identity.Repositories;

namespace Qaflaty.Application.Identity.Queries.GetCurrentCustomer;

public class GetCurrentCustomerQueryHandler : IQueryHandler<GetCurrentCustomerQuery, StoreCustomerDto>
{
    private readonly IStoreCustomerRepository _customerRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetCurrentCustomerQueryHandler(
        IStoreCustomerRepository customerRepository,
        ICurrentUserService currentUserService)
    {
        _customerRepository = customerRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result<StoreCustomerDto>> Handle(GetCurrentCustomerQuery request, CancellationToken cancellationToken)
    {
        if (_currentUserService.CustomerId == null)
            return Result.Failure<StoreCustomerDto>(new Error("StoreCustomer.NotFound", "Customer not found"));

        var customer = await _customerRepository.GetByIdAsync(_currentUserService.CustomerId.Value, cancellationToken);
        if (customer == null)
            return Result.Failure<StoreCustomerDto>(new Error("StoreCustomer.NotFound", "Customer not found"));

        return Result.Success(new StoreCustomerDto(
            customer.Id.Value,
            customer.Email.Value,
            customer.FullName.Value,
            customer.Phone?.Value,
            customer.IsVerified,
            customer.CreatedAt,
            customer.Addresses.Select(a => new CustomerAddressDto(
                a.Label,
                a.Street,
                a.City,
                a.State,
                a.PostalCode,
                a.Country,
                a.IsDefault)).ToList()));
    }
}
