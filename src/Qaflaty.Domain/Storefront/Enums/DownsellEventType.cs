namespace Qaflaty.Domain.Storefront.Enums;

/// <summary>A recorded downsell analytics event, for merchant reporting on offer performance.</summary>
public enum DownsellEventType
{
    /// <summary>The offer was shown to the customer.</summary>
    Impression = 0,

    /// <summary>The customer interacted with the offer (clicked a cheaper product, or the coupon).</summary>
    Accept = 1,

    /// <summary>The customer dismissed the offer without acting on it.</summary>
    Dismiss = 2,

    /// <summary>The advertised coupon was actually redeemed at checkout.</summary>
    CouponRedeemed = 3,

    /// <summary>The customer completed an order after seeing the offer.</summary>
    Converted = 4
}
