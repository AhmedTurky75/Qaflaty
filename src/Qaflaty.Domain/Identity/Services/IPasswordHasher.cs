using Qaflaty.Domain.Identity.ValueObjects;

namespace Qaflaty.Domain.Identity.Services;

public interface IPasswordHasher
{
    HashedPassword Hash(string password);
    bool Verify(string password, HashedPassword hashedPassword);
}
