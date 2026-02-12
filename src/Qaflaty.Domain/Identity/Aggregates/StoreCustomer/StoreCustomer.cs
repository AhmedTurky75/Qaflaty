using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Identity.Aggregates.StoreCustomer.Events;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.ValueObjects;

namespace Qaflaty.Domain.Identity.Aggregates.StoreCustomer;

public sealed class StoreCustomer : AggregateRoot<StoreCustomerId>
{
    // Properties
    public Email Email { get; private set; } = null!;
    public HashedPassword PasswordHash { get; private set; } = null!;
    public PersonName FullName { get; private set; } = null!;
    public PhoneNumber? Phone { get; private set; }
    public bool IsVerified { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Navigation - Addresses
    private readonly List<CustomerAddress> _addresses = [];
    public IReadOnlyList<CustomerAddress> Addresses => _addresses.AsReadOnly();

    // Navigation - Refresh Tokens
    private readonly List<CustomerRefreshToken> _refreshTokens = [];
    public IReadOnlyList<CustomerRefreshToken> RefreshTokens => _refreshTokens.AsReadOnly();

    // Private constructor for EF Core
    private StoreCustomer() : base(StoreCustomerId.Empty) { }

    // Factory method
    public static Result<StoreCustomer> Create(
        Email email,
        HashedPassword passwordHash,
        PersonName fullName,
        PhoneNumber? phone = null)
    {
        var customer = new StoreCustomer
        {
            Id = StoreCustomerId.New(),
            Email = email,
            PasswordHash = passwordHash,
            FullName = fullName,
            Phone = phone,
            IsVerified = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        customer.RaiseDomainEvent(new StoreCustomerRegisteredEvent(customer.Id, email));

        return Result<StoreCustomer>.Success(customer);
    }

    // Behaviors
    public Result ChangePassword(HashedPassword newPasswordHash)
    {
        PasswordHash = newPasswordHash;
        UpdatedAt = DateTime.UtcNow;
        RaiseDomainEvent(new CustomerPasswordChangedEvent(Id));
        return Result.Success();
    }

    public Result UpdateProfile(PersonName fullName, PhoneNumber? phone)
    {
        FullName = fullName;
        Phone = phone;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result Verify()
    {
        if (IsVerified)
            return Result.Failure(IdentityErrors.AlreadyVerified);

        IsVerified = true;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    // Address Management
    public Result<CustomerAddress> AddAddress(CustomerAddress address)
    {
        // If this is the first address, make it default
        if (_addresses.Count == 0 && !address.IsDefault)
        {
            address.SetAsDefault();
        }
        // If this address is being set as default, unset all others
        else if (address.IsDefault)
        {
            foreach (var existingAddress in _addresses)
            {
                existingAddress.UnsetAsDefault();
            }
        }

        _addresses.Add(address);
        UpdatedAt = DateTime.UtcNow;
        return Result<CustomerAddress>.Success(address);
    }

    public Result RemoveAddress(CustomerAddress address)
    {
        var existingAddress = _addresses.FirstOrDefault(a => a == address);
        if (existingAddress == null)
            return Result.Failure(new Error("StoreCustomer.AddressNotFound", "Address not found"));

        _addresses.Remove(existingAddress);

        // If we removed the default address and there are others, make the first one default
        if (existingAddress.IsDefault && _addresses.Count > 0)
        {
            _addresses[0].SetAsDefault();
        }

        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result SetDefaultAddress(CustomerAddress address)
    {
        var existingAddress = _addresses.FirstOrDefault(a => a == address);
        if (existingAddress == null)
            return Result.Failure(new Error("StoreCustomer.AddressNotFound", "Address not found"));

        // Unset all other addresses as default
        foreach (var addr in _addresses)
        {
            addr.UnsetAsDefault();
        }

        existingAddress.SetAsDefault();
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    // Refresh Token Management
    public CustomerRefreshToken AddRefreshToken(string token, DateTime expiresAt)
    {
        var refreshToken = CustomerRefreshToken.Create(Id, token, expiresAt);
        _refreshTokens.Add(refreshToken);
        return refreshToken;
    }

    public void RevokeRefreshToken(string token)
    {
        var refreshToken = _refreshTokens.FirstOrDefault(rt => rt.Token == token);
        refreshToken?.Revoke();
    }

    public void RevokeAllRefreshTokens()
    {
        foreach (var token in _refreshTokens.Where(rt => !rt.IsRevoked))
            token.Revoke();
    }
}
