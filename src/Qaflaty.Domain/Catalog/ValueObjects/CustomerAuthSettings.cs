using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed class CustomerAuthSettings : ValueObject
{
    public CustomerAuthMode Mode { get; private set; }
    public bool AllowGuestCheckout { get; private set; }
    public bool RequireEmailVerification { get; private set; }

    private CustomerAuthSettings() { }

    public static CustomerAuthSettings CreateDefault() => new()
    {
        Mode = CustomerAuthMode.GuestOnly,
        AllowGuestCheckout = true,
        RequireEmailVerification = false
    };

    public static CustomerAuthSettings Create(
        CustomerAuthMode mode, bool allowGuestCheckout, bool requireEmailVerification) => new()
    {
        Mode = mode,
        AllowGuestCheckout = allowGuestCheckout,
        RequireEmailVerification = requireEmailVerification
    };

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Mode;
        yield return AllowGuestCheckout;
        yield return RequireEmailVerification;
    }
}
