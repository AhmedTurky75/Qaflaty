using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Domain.Identity.Errors;

public static class IdentityErrors
{
    public static readonly Error EmailAlreadyExists =
        new("Identity.EmailAlreadyExists", "Email is already registered");

    public static readonly Error InvalidCredentials =
        new("Identity.InvalidCredentials", "Invalid email or password");

    public static readonly Error MerchantNotFound =
        new("Identity.MerchantNotFound", "Merchant not found");

    public static readonly Error InvalidRefreshToken =
        new("Identity.InvalidRefreshToken", "Refresh token is invalid or expired");

    public static readonly Error AlreadyVerified =
        new("Identity.AlreadyVerified", "Merchant is already verified");

    public static readonly Error NameRequired =
        new("Identity.NameRequired", "Name is required");

    public static readonly Error NameInvalidLength =
        new("Identity.NameInvalidLength", "Name must be between 2 and 100 characters");
}
