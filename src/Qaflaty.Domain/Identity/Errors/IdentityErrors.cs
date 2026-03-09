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

    // Name errors (legacy)
    public static readonly Error NameRequired =
        new("Identity.NameRequired", "Name is required");

    public static readonly Error NameInvalidLength =
        new("Identity.NameInvalidLength", "Name must be between 2 and 100 characters");

    // First name errors
    public static readonly Error FirstNameRequired =
        new("Identity.FirstNameRequired", "First name is required");

    public static readonly Error FirstNameInvalidLength =
        new("Identity.FirstNameInvalidLength", "First name must be between 2 and 50 characters");

    // Last name errors
    public static readonly Error LastNameRequired =
        new("Identity.LastNameRequired", "Last name is required");

    public static readonly Error LastNameInvalidLength =
        new("Identity.LastNameInvalidLength", "Last name must be between 2 and 50 characters");

    // Username errors
    public static readonly Error UsernameRequired =
        new("Identity.UsernameRequired", "Username is required");

    public static readonly Error UsernameInvalidLength =
        new("Identity.UsernameInvalidLength", "Username must be between 3 and 50 characters");

    public static readonly Error UsernameInvalidFormat =
        new("Identity.UsernameInvalidFormat", "Username may only contain letters, digits, underscores, and hyphens");

    public static readonly Error UsernameAlreadyExists =
        new("Identity.UsernameAlreadyExists", "Username is already taken");

    // OTP errors
    public static readonly Error OtpExpired =
        new("Identity.OtpExpired", "OTP has expired");

    public static readonly Error OtpInvalid =
        new("Identity.OtpInvalid", "Invalid OTP code");

    public static readonly Error OtpMaxAttemptsReached =
        new("Identity.OtpMaxAttemptsReached", "Maximum OTP attempts reached");

    public static readonly Error OtpAlreadyUsed =
        new("Identity.OtpAlreadyUsed", "OTP has already been used");

    public static readonly Error OtpResendTooSoon =
        new("Identity.OtpResendTooSoon", "Please wait before requesting a new OTP");

    public static readonly Error OtpNotFound =
        new("Identity.OtpNotFound", "OTP not found");

    public static readonly Error CustomerNotFound =
        new("Identity.CustomerNotFound", "Customer not found");

    // Store access & permission errors
    public static readonly Error StoreAccessDenied =
        new("Identity.StoreAccessDenied", "You do not have access to this store");

    public static readonly Error InsufficientPermissions =
        new("Identity.InsufficientPermissions", "You do not have permission to perform this action");

    public static readonly Error AlreadyAssignedToStore =
        new("Identity.AlreadyAssignedToStore", "Merchant is already assigned to this store");
}
