using Qaflaty.Domain.Identity.Services;
using Qaflaty.Domain.Identity.ValueObjects;

namespace Qaflaty.Infrastructure.Services.Identity;

public class PasswordHasher : IPasswordHasher
{
    public HashedPassword Hash(string password)
    {
        var hash = BCrypt.Net.BCrypt.HashPassword(password);
        return HashedPassword.FromHash(hash);
    }

    public bool Verify(string password, HashedPassword hashedPassword)
    {
        return BCrypt.Net.BCrypt.Verify(password, hashedPassword.Value);
    }
}
