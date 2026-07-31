using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Domain.Catalog.Errors;

public static class PromoCodeErrors
{
    public static readonly Error NotFound =
        new("PromoCode.NotFound", "Promo code not found");

    public static readonly Error CodeRequired =
        new("PromoCode.CodeRequired", "Promo code text is required");

    public static readonly Error CodeAlreadyExists =
        new("PromoCode.AlreadyExists", "A promo code with this code already exists");

    public static readonly Error InvalidPercentage =
        new("PromoCode.InvalidPercentage", "Percentage value must be between 1 and 100");

    public static readonly Error InvalidValue =
        new("PromoCode.InvalidValue", "Discount value must be greater than zero");

    public static readonly Error Inactive =
        new("PromoCode.Inactive", "This promo code is not active");

    public static readonly Error NotStarted =
        new("PromoCode.NotStarted", "This promo code is not valid yet");

    public static readonly Error Expired =
        new("PromoCode.Expired", "This promo code has expired");

    public static readonly Error MinimumOrderNotMet =
        new("PromoCode.MinimumOrderNotMet", "Order total does not meet the minimum required for this promo code");

    public static readonly Error UsageLimitReached =
        new("PromoCode.UsageLimitReached", "This promo code has reached its usage limit");

    public static readonly Error CustomerLimitReached =
        new("PromoCode.CustomerLimitReached", "You have already used this promo code the maximum number of times");
}
