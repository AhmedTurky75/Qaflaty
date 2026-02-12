using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Identity.DTOs;
using Qaflaty.Application.Identity.Services;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.Repositories;
using Qaflaty.Domain.Identity.Services;

namespace Qaflaty.Application.Identity.Commands.LoginStoreCustomer;

public class LoginStoreCustomerCommandHandler : ICommandHandler<LoginStoreCustomerCommand, CustomerAuthResponse>
{
    private readonly IStoreCustomerRepository _customerRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;

    public LoginStoreCustomerCommandHandler(
        IStoreCustomerRepository customerRepository,
        IPasswordHasher passwordHasher,
        ITokenService tokenService)
    {
        _customerRepository = customerRepository;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
    }

    public async Task<Result<CustomerAuthResponse>> Handle(LoginStoreCustomerCommand request, CancellationToken cancellationToken)
    {
        // Create Email value object
        var emailResult = Email.Create(request.Email);
        if (emailResult.IsFailure)
            return Result.Failure<CustomerAuthResponse>(IdentityErrors.InvalidCredentials);

        // Find customer by email
        var customer = await _customerRepository.GetByEmailAsync(emailResult.Value, cancellationToken);
        if (customer == null)
            return Result.Failure<CustomerAuthResponse>(IdentityErrors.InvalidCredentials);

        // Verify password
        var isPasswordValid = _passwordHasher.Verify(request.Password, customer.PasswordHash);
        if (!isPasswordValid)
            return Result.Failure<CustomerAuthResponse>(IdentityErrors.InvalidCredentials);

        // Generate tokens
        var accessToken = _tokenService.GenerateCustomerAccessToken(customer);
        var refreshToken = _tokenService.GenerateRefreshToken();
        var expiresAt = _tokenService.GetAccessTokenExpiration();
        var refreshTokenExpiresAt = _tokenService.GetRefreshTokenExpiration();

        // Add refresh token to customer
        customer.AddRefreshToken(refreshToken, refreshTokenExpiresAt);

        _customerRepository.Update(customer);

        // Map to DTO
        var customerDto = new StoreCustomerDto(
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
                a.IsDefault)).ToList());

        var response = new CustomerAuthResponse(
            accessToken,
            refreshToken,
            expiresAt,
            customerDto);

        return Result.Success(response);
    }
}
