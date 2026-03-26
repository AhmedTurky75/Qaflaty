using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Identity.Repositories;

namespace Qaflaty.Application.Identity.Commands.EditCustomerAddress;

public class EditCustomerAddressCommandHandler : ICommandHandler<EditCustomerAddressCommand>
{
    private readonly IStoreCustomerRepository _customerRepository;

    public EditCustomerAddressCommandHandler(IStoreCustomerRepository customerRepository)
    {
        _customerRepository = customerRepository;
    }

    public async Task<Result> Handle(EditCustomerAddressCommand request, CancellationToken cancellationToken)
    {
        var customer = await _customerRepository.GetByIdAsync(request.CustomerId, cancellationToken);
        if (customer == null)
            return Result.Failure(new Error("StoreCustomer.NotFound", "Customer not found"));

        var result = customer.UpdateAddress(
            request.OriginalLabel,
            request.Label,
            request.Street,
            request.City,
            request.State,
            request.PostalCode,
            request.Country,
            request.IsDefault,
            request.Latitude,
            request.Longitude);

        if (result.IsFailure)
            return result;

        _customerRepository.Update(customer);

        return Result.Success();
    }
}
