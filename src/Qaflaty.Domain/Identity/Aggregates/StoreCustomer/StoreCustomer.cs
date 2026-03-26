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
    public string Username { get; private set; } = null!;
    public PhoneNumber? Phone { get; private set; }
    public PhoneNumber? SecondaryPhone { get; private set; }
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
        string username,
        PhoneNumber? phone = null)
    {
        var customer = new StoreCustomer
        {
            Id = StoreCustomerId.New(),
            Email = email,
            PasswordHash = passwordHash,
            FullName = fullName,
            Username = username,
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

    public Result UpdateProfile(PersonName fullName, PhoneNumber? phone, string? username = null, PhoneNumber? secondaryPhone = null)
    {
        FullName = fullName;
        Phone = phone;
        SecondaryPhone = secondaryPhone;
        if (username != null)
            Username = username;
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
        if (_addresses.Any(a => a.Label == address.Label))
            return Result.Failure<CustomerAddress>(
                new Error("CustomerAddress.DuplicateLabel", $"An address with label '{address.Label}' already exists"));

        if (_addresses.Count == 0)
            address.SetAsDefault();
        else if (address.IsDefault)
            foreach (var a in _addresses) a.UnsetAsDefault();

        _addresses.Add(address);
        UpdatedAt = DateTime.UtcNow;
        return Result<CustomerAddress>.Success(address);
    }

    public Result UpdateAddress(
        string originalLabel,
        string label,
        string street,
        string city,
        string state,
        string postalCode,
        string country,
        bool isDefault,
        decimal latitude,
        decimal longitude)
    {
        var address = _addresses.FirstOrDefault(a => a.Label == originalLabel);
        if (address == null)
            return Result.Failure(new Error("CustomerAddress.NotFound", "Address not found"));

        // If label is changing, check for duplicate
        if (!string.Equals(originalLabel, label, StringComparison.OrdinalIgnoreCase)
            && _addresses.Any(a => a.Label == label))
            return Result.Failure(
                new Error("CustomerAddress.DuplicateLabel", $"An address with label '{label}' already exists"));

        var updateResult = address.Update(label, street, city, state, postalCode, country, latitude, longitude);
        if (updateResult.IsFailure)
            return updateResult;

        if (isDefault)
        {
            foreach (var a in _addresses) a.UnsetAsDefault();
            address.SetAsDefault();
        }

        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result RemoveAddress(string label)
    {
        var address = _addresses.FirstOrDefault(a => a.Label == label);
        if (address == null)
            return Result.Failure(new Error("CustomerAddress.NotFound", "Address not found"));

        _addresses.Remove(address);

        if (address.IsDefault && _addresses.Count > 0)
            _addresses[0].SetAsDefault();

        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result SetDefaultAddress(string label)
    {
        var address = _addresses.FirstOrDefault(a => a.Label == label);
        if (address == null)
            return Result.Failure(new Error("CustomerAddress.NotFound", "Address not found"));

        foreach (var a in _addresses) a.UnsetAsDefault();
        address.SetAsDefault();
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
