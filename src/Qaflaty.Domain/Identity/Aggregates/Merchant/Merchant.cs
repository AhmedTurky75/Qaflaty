using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Identity.Aggregates.Merchant.Events;
using Qaflaty.Domain.Identity.Enums;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.ValueObjects;

namespace Qaflaty.Domain.Identity.Aggregates.Merchant;

public sealed class Merchant : AggregateRoot<MerchantId>
{
    // Properties
    public Email Email { get; private set; } = null!; // Merchant's login email (unique), e.g. "owner@shop.com"
    public HashedPassword PasswordHash { get; private set; } = null!; // Bcrypt hash of the merchant's password (never the plaintext)
    public PersonName FullName { get; private set; } = null!; // Merchant's first + last name
    public string Username { get; private set; } = null!; // Unique login username/handle for the merchant
    public PhoneNumber? Phone { get; private set; } // Optional contact phone number
    public bool IsVerified { get; private set; } // Whether the merchant account has completed verification
    public DateTime CreatedAt { get; private set; } // UTC timestamp when the merchant registered
    public DateTime UpdatedAt { get; private set; } // UTC timestamp of the last profile change

    // Navigation - Refresh Tokens
    private readonly List<RefreshToken> _refreshTokens = []; // Backing list of issued refresh tokens
    public IReadOnlyList<RefreshToken> RefreshTokens => _refreshTokens.AsReadOnly(); // Active/revoked JWT refresh tokens for this merchant's sessions

    // Navigation - Store Assignments
    private readonly List<MerchantStoreAssignment> _storeAssignments = []; // Backing list of store memberships
    public IReadOnlyList<MerchantStoreAssignment> StoreAssignments => _storeAssignments.AsReadOnly(); // Which stores this merchant can access and with what role (multi-store / staff support)

    // Private constructor for EF Core
    private Merchant() : base(MerchantId.Empty) { }

    // Factory method
    public static Result<Merchant> Create(
        Email email,
        HashedPassword passwordHash,
        PersonName fullName,
        string username,
        PhoneNumber? phone = null)
    {
        var merchant = new Merchant
        {
            Id = MerchantId.New(),
            Email = email,
            PasswordHash = passwordHash,
            FullName = fullName,
            Username = username,
            Phone = phone,
            IsVerified = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        merchant.RaiseDomainEvent(new MerchantRegisteredEvent(merchant.Id, email));

        return Result<Merchant>.Success(merchant);
    }

    // Behaviors
    public Result ChangePassword(HashedPassword newPasswordHash)
    {
        PasswordHash = newPasswordHash;
        UpdatedAt = DateTime.UtcNow;
        RaiseDomainEvent(new PasswordChangedEvent(Id));
        return Result.Success();
    }

    public Result UpdateProfile(PersonName fullName, PhoneNumber? phone, string? username = null)
    {
        FullName = fullName;
        Phone = phone;
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

    // Refresh Token Management
    public RefreshToken AddRefreshToken(string token, DateTime expiresAt)
    {
        var refreshToken = RefreshToken.Create(Id, token, expiresAt);
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

    // Store Assignment Management
    public MerchantStoreAssignment AssignToStore(StoreId storeId, MerchantRole role, MerchantId? invitedBy = null)
    {
        var existing = _storeAssignments.FirstOrDefault(a => a.StoreId == storeId && a.IsActive);
        if (existing != null) return existing;

        var assignment = MerchantStoreAssignment.Create(Id, storeId, role, invitedBy);
        _storeAssignments.Add(assignment);
        UpdatedAt = DateTime.UtcNow;
        return assignment;
    }

    public void RemoveFromStore(StoreId storeId)
    {
        var assignment = _storeAssignments.FirstOrDefault(a => a.StoreId == storeId && a.IsActive);
        assignment?.Deactivate();
        UpdatedAt = DateTime.UtcNow;
    }

    public bool HasAccessToStore(StoreId storeId)
        => _storeAssignments.Any(a => a.StoreId == storeId && a.IsActive);

    public MerchantRole? GetRoleForStore(StoreId storeId)
        => _storeAssignments.FirstOrDefault(a => a.StoreId == storeId && a.IsActive)?.Role;
}
