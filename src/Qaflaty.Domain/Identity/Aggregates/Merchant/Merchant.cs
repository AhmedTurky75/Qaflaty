using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Identity.Aggregates.Merchant.Events;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.ValueObjects;

namespace Qaflaty.Domain.Identity.Aggregates.Merchant;

public sealed class Merchant : AggregateRoot<MerchantId>
{
    // Properties
    public Email Email { get; private set; } = null!;
    public HashedPassword PasswordHash { get; private set; } = null!;
    public PersonName FullName { get; private set; } = null!;
    public PhoneNumber? Phone { get; private set; }
    public bool IsVerified { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Navigation
    private readonly List<RefreshToken> _refreshTokens = [];
    public IReadOnlyList<RefreshToken> RefreshTokens => _refreshTokens.AsReadOnly();

    // Private constructor for EF Core
    private Merchant() : base(MerchantId.Empty) { }

    // Factory method
    public static Result<Merchant> Create(
        Email email,
        HashedPassword passwordHash,
        PersonName fullName,
        PhoneNumber? phone = null)
    {
        var merchant = new Merchant
        {
            Id = MerchantId.New(),
            Email = email,
            PasswordHash = passwordHash,
            FullName = fullName,
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
}
