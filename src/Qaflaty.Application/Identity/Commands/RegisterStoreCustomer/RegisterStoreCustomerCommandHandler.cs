using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Identity.DTOs;
using Qaflaty.Application.Identity.Services;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Identity.Aggregates.StoreCustomer;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.Repositories;
using Qaflaty.Domain.Identity.Services;
using Qaflaty.Domain.Identity.ValueObjects;

namespace Qaflaty.Application.Identity.Commands.RegisterStoreCustomer;

public class RegisterStoreCustomerCommandHandler : ICommandHandler<RegisterStoreCustomerCommand, CustomerAuthResponse>
{
    private readonly IStoreCustomerRepository _customerRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;

    public RegisterStoreCustomerCommandHandler(
        IStoreCustomerRepository customerRepository,
        IPasswordHasher passwordHasher,
        ITokenService tokenService)
    {
        _customerRepository = customerRepository;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
    }

    public async Task<Result<CustomerAuthResponse>> Handle(RegisterStoreCustomerCommand request, CancellationToken cancellationToken)
    {
        // Create Email value object
        var emailResult = Email.Create(request.Email);
        if (emailResult.IsFailure)
            return Result.Failure<CustomerAuthResponse>(emailResult.Error);

        // Check if email already exists
        var emailExists = await _customerRepository.ExistsByEmailAsync(emailResult.Value, cancellationToken);
        if (emailExists)
            return Result.Failure<CustomerAuthResponse>(IdentityErrors.EmailAlreadyExists);

        // Check if username already exists
        var usernameExists = await _customerRepository.ExistsByUsernameAsync(request.Username, cancellationToken);
        if (usernameExists)
            return Result.Failure<CustomerAuthResponse>(IdentityErrors.UsernameAlreadyExists);

        // Create PersonName value object
        var nameResult = PersonName.Create(request.FirstName, request.LastName);
        if (nameResult.IsFailure)
            return Result.Failure<CustomerAuthResponse>(nameResult.Error);

        // Create PhoneNumber value object if provided
        PhoneNumber? phone = null;
        if (!string.IsNullOrWhiteSpace(request.Phone))
        {
            var phoneResult = PhoneNumber.Create(request.Phone);
            if (phoneResult.IsFailure)
                return Result.Failure<CustomerAuthResponse>(phoneResult.Error);
            phone = phoneResult.Value;
        }

        // Hash password
        var hashedPassword = _passwordHasher.Hash(request.Password);

        // Create StoreCustomer aggregate
        var customerResult = StoreCustomer.Create(
            emailResult.Value,
            hashedPassword,
            nameResult.Value,
            request.Username,
            phone);

        if (customerResult.IsFailure)
            return Result.Failure<CustomerAuthResponse>(customerResult.Error);

        var customer = customerResult.Value;

        // Generate tokens
        var accessToken = _tokenService.GenerateCustomerAccessToken(customer);
        var refreshToken = _tokenService.GenerateRefreshToken();
        var expiresAt = _tokenService.GetCustomerAccessTokenExpiration();
        var refreshTokenExpiresAt = _tokenService.GetRefreshTokenExpiration();

        // Add refresh token to customer
        customer.AddRefreshToken(refreshToken, refreshTokenExpiresAt);

        // Save customer
        await _customerRepository.AddAsync(customer, cancellationToken);

        // Map to DTO
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

        var response = new CustomerAuthResponse(
            accessToken,
            refreshToken,
            expiresAt,
            customerDto);

        return Result.Success(response);
    }
}
