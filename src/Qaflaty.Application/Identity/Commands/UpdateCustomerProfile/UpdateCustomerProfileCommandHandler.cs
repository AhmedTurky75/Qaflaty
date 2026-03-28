using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.Repositories;
using Qaflaty.Domain.Identity.ValueObjects;

namespace Qaflaty.Application.Identity.Commands.UpdateCustomerProfile;

public class UpdateCustomerProfileCommandHandler : ICommandHandler<UpdateCustomerProfileCommand>
{
    private readonly IStoreCustomerRepository _customerRepository;

    public UpdateCustomerProfileCommandHandler(IStoreCustomerRepository customerRepository)
    {
        _customerRepository = customerRepository;
    }

    public async Task<Result> Handle(UpdateCustomerProfileCommand request, CancellationToken cancellationToken)
    {
        var customer = await _customerRepository.GetByIdAsync(request.CustomerId, cancellationToken);
        if (customer == null)
            return Result.Failure(new Error("StoreCustomer.NotFound", "Customer not found"));

        var nameResult = PersonName.Create(request.FirstName, request.LastName);
        if (nameResult.IsFailure)
            return Result.Failure(nameResult.Error);

        PhoneNumber? phone = null;
        if (!string.IsNullOrWhiteSpace(request.Phone))
        {
            var phoneResult = PhoneNumber.Create(request.Phone, request.PhoneCountryCode ?? string.Empty);
            if (phoneResult.IsFailure)
                return Result.Failure(phoneResult.Error);
            phone = phoneResult.Value;
        }

        PhoneNumber? secondaryPhone = null;
        if (!string.IsNullOrWhiteSpace(request.SecondaryPhone))
        {
            var secondaryPhoneResult = PhoneNumber.Create(request.SecondaryPhone, request.SecondaryPhoneCountryCode ?? string.Empty);
            if (secondaryPhoneResult.IsFailure)
                return Result.Failure(secondaryPhoneResult.Error);
            secondaryPhone = secondaryPhoneResult.Value;
        }

        customer.UpdateProfile(nameResult.Value, phone, secondaryPhone: secondaryPhone);
        _customerRepository.Update(customer);

        return Result.Success();
    }
}
