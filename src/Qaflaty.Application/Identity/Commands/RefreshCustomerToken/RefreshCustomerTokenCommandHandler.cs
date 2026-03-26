using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Identity.DTOs;
using Qaflaty.Application.Identity.Services;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.Repositories;

namespace Qaflaty.Application.Identity.Commands.RefreshCustomerToken;

public class RefreshCustomerTokenCommandHandler : ICommandHandler<RefreshCustomerTokenCommand, CustomerAuthResponse>
{
    private readonly IStoreCustomerRepository _customerRepository;
    private readonly ITokenService _tokenService;

    public RefreshCustomerTokenCommandHandler(
        IStoreCustomerRepository customerRepository,
        ITokenService tokenService)
    {
        _customerRepository = customerRepository;
        _tokenService = tokenService;
    }

    public async Task<Result<CustomerAuthResponse>> Handle(
        RefreshCustomerTokenCommand request,
        CancellationToken cancellationToken)
    {
        // Find the refresh token
        var refreshToken = await _customerRepository.GetRefreshTokenAsync(request.RefreshToken, cancellationToken);
        if (refreshToken == null || !refreshToken.IsActive)
            return Result.Failure<CustomerAuthResponse>(IdentityErrors.InvalidRefreshToken);

        // Get the customer
        var customer = await _customerRepository.GetByIdAsync(refreshToken.StoreCustomerId, cancellationToken);
        if (customer == null)
            return Result.Failure<CustomerAuthResponse>(IdentityErrors.CustomerNotFound);

        // Revoke the old refresh token
        customer.RevokeRefreshToken(request.RefreshToken);

        // Generate new tokens
        var accessToken = _tokenService.GenerateCustomerAccessToken(customer);
        var newRefreshToken = _tokenService.GenerateRefreshToken();
        var expiresAt = _tokenService.GetCustomerAccessTokenExpiration();
        var refreshTokenExpiresAt = _tokenService.GetRefreshTokenExpiration();

        // Add new refresh token
        customer.AddRefreshToken(newRefreshToken, refreshTokenExpiresAt);
        _customerRepository.Update(customer);

        var customerDto = new StoreCustomerDto(
            customer.Id.Value,
            customer.Email.Value,
            customer.FullName.FirstName,
            customer.FullName.LastName,
            customer.FullName.FullName,
            customer.Username,
            customer.Phone?.Value,
            customer.SecondaryPhone?.Value,
            customer.IsVerified,
            customer.CreatedAt,
            customer.Addresses.Select(a => new CustomerAddressDto(
                a.Label,
                a.Street,
                a.City,
                a.State,
                a.PostalCode,
                a.Country,
                a.IsDefault,
                a.Latitude,
                a.Longitude)).ToList());

        return Result.Success(new CustomerAuthResponse(accessToken, newRefreshToken, expiresAt, customerDto));
    }
}
