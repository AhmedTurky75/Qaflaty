using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.Repositories;

namespace Qaflaty.Application.Identity.Commands.LogoutStoreCustomer;

public class LogoutStoreCustomerCommandHandler : ICommandHandler<LogoutStoreCustomerCommand>
{
    private readonly IStoreCustomerRepository _customerRepository;
    private readonly ICurrentUserService _currentUserService;

    public LogoutStoreCustomerCommandHandler(
        IStoreCustomerRepository customerRepository,
        ICurrentUserService currentUserService)
    {
        _customerRepository = customerRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result> Handle(LogoutStoreCustomerCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.CustomerId == null)
            return Result.Failure(IdentityErrors.CustomerNotFound);

        var customer = await _customerRepository.GetByIdAsync(_currentUserService.CustomerId.Value, cancellationToken);
        if (customer == null)
            return Result.Failure(IdentityErrors.CustomerNotFound);

        // Revoke the refresh token
        customer.RevokeRefreshToken(request.RefreshToken);
        _customerRepository.Update(customer);

        return Result.Success();
    }
}
