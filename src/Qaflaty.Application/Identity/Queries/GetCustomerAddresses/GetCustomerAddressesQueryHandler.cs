using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Identity.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.Repositories;

namespace Qaflaty.Application.Identity.Queries.GetCustomerAddresses;

public class GetCustomerAddressesQueryHandler : IQueryHandler<GetCustomerAddressesQuery, List<CustomerAddressDto>>
{
    private readonly IStoreCustomerRepository _customerRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetCustomerAddressesQueryHandler(
        IStoreCustomerRepository customerRepository,
        ICurrentUserService currentUserService)
    {
        _customerRepository = customerRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result<List<CustomerAddressDto>>> Handle(
        GetCustomerAddressesQuery request,
        CancellationToken cancellationToken)
    {
        if (_currentUserService.CustomerId == null)
            return Result.Failure<List<CustomerAddressDto>>(IdentityErrors.CustomerNotFound);

        var customer = await _customerRepository.GetByIdAsync(_currentUserService.CustomerId.Value, cancellationToken);
        if (customer == null)
            return Result.Failure<List<CustomerAddressDto>>(IdentityErrors.CustomerNotFound);

        var addresses = customer.Addresses.Select(a => new CustomerAddressDto(
            a.Label,
            a.Street,
            a.City,
            a.State,
            a.PostalCode,
            a.Country,
            a.IsDefault,
            a.Latitude,
            a.Longitude,
            a.CountryCode,
            a.CityId,
            a.DistrictId)).ToList();

        return Result.Success(addresses);
    }
}
