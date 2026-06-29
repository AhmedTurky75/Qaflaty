using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed class CustomerAuthSettings : ValueObject
{
    public CustomerAuthMode Mode { get; private set; } // How customers authenticate: GuestOnly / Optional / Required accounts
    public bool AllowGuestCheckout { get; private set; } // Whether customers can complete checkout without creating an account
    public bool RequireEmailVerification { get; private set; } // Whether a new customer must verify their email before using the account
    public bool RequireOtpOnPlaceOrder { get; private set; } // Whether an email OTP must be verified to confirm an order before it leaves Pending

    private CustomerAuthSettings() { }

    public static CustomerAuthSettings CreateDefault() => new()
    {
        Mode = CustomerAuthMode.GuestOnly,
        AllowGuestCheckout = true,
        RequireEmailVerification = false,
        RequireOtpOnPlaceOrder = false
    };

    public static CustomerAuthSettings Create(
        CustomerAuthMode mode,
        bool allowGuestCheckout,
        bool requireEmailVerification,
        bool requireOtpOnPlaceOrder = false) => new()
    {
        Mode = mode,
        AllowGuestCheckout = allowGuestCheckout,
        RequireEmailVerification = requireEmailVerification,
        RequireOtpOnPlaceOrder = requireOtpOnPlaceOrder
    };

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Mode;
        yield return AllowGuestCheckout;
        yield return RequireEmailVerification;
        yield return RequireOtpOnPlaceOrder;
    }
}
