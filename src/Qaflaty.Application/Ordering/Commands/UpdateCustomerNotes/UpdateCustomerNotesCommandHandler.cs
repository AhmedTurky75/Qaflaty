using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Ordering.Errors;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Application.Ordering.Commands.UpdateCustomerNotes;

public class UpdateCustomerNotesCommandHandler : ICommandHandler<UpdateCustomerNotesCommand>
{
    private readonly ICustomerRepository _customerRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;

    public UpdateCustomerNotesCommandHandler(
        ICustomerRepository customerRepository,
        IStoreRepository storeRepository,
        ICurrentUserService currentUserService)
    {
        _customerRepository = customerRepository;
        _storeRepository = storeRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result> Handle(UpdateCustomerNotesCommand request, CancellationToken cancellationToken)
    {
        var customerId = new CustomerId(request.CustomerId);
        var customer = await _customerRepository.GetByIdAsync(customerId, cancellationToken);
        if (customer == null)
            return Result.Failure(OrderingErrors.CustomerNotFound);

        var store = await _storeRepository.GetByIdAsync(customer.StoreId, cancellationToken);
        if (store == null || store.MerchantId.Value != _currentUserService.MerchantId?.Value)
            return Result.Failure(new Error("Customer.Unauthorized", "You don't have access to this customer"));

        customer.AddNote(request.Note);
        _customerRepository.Update(customer);
        return Result.Success();
    }
}
