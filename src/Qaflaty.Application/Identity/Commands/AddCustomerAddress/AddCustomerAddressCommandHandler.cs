using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Identity.Repositories;
using Qaflaty.Domain.Identity.ValueObjects;

namespace Qaflaty.Application.Identity.Commands.AddCustomerAddress;

public class AddCustomerAddressCommandHandler : ICommandHandler<AddCustomerAddressCommand>
{
    private readonly IStoreCustomerRepository _customerRepository;

    public AddCustomerAddressCommandHandler(IStoreCustomerRepository customerRepository)
    {
        _customerRepository = customerRepository;
    }

    public async Task<Result> Handle(AddCustomerAddressCommand request, CancellationToken cancellationToken)
    {
        var customer = await _customerRepository.GetByIdAsync(request.CustomerId, cancellationToken);
        if (customer == null)
            return Result.Failure(new Error("StoreCustomer.NotFound", "Customer not found"));

        var addressResult = CustomerAddress.Create(
            request.Label,
            request.Street,
            request.City,
            request.State,
            request.PostalCode,
            request.Country,
            request.IsDefault);

        if (addressResult.IsFailure)
            return Result.Failure(addressResult.Error);

        customer.AddAddress(addressResult.Value);
        _customerRepository.Update(customer);

        return Result.Success();
    }
}
