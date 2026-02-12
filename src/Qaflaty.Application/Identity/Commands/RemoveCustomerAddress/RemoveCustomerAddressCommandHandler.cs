using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Identity.Repositories;

namespace Qaflaty.Application.Identity.Commands.RemoveCustomerAddress;

public class RemoveCustomerAddressCommandHandler : ICommandHandler<RemoveCustomerAddressCommand>
{
    private readonly IStoreCustomerRepository _customerRepository;

    public RemoveCustomerAddressCommandHandler(IStoreCustomerRepository customerRepository)
    {
        _customerRepository = customerRepository;
    }

    public async Task<Result> Handle(RemoveCustomerAddressCommand request, CancellationToken cancellationToken)
    {
        var customer = await _customerRepository.GetByIdAsync(request.CustomerId, cancellationToken);
        if (customer == null)
            return Result.Failure(new Error("StoreCustomer.NotFound", "Customer not found"));

        var address = customer.Addresses.FirstOrDefault(a => a.Label == request.Label);
        if (address == null)
            return Result.Failure(new Error("CustomerAddress.NotFound", "Address not found"));

        var result = customer.RemoveAddress(address);
        if (result.IsFailure)
            return result;

        _customerRepository.Update(customer);

        return Result.Success();
    }
}
