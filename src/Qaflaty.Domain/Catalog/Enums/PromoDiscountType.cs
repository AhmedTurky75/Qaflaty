namespace Qaflaty.Domain.Catalog.Enums;

public enum PromoDiscountType
{
    /// <summary>A percentage off the cart subtotal (Value is 0–100).</summary>
    Percentage,

    /// <summary>A flat monetary amount off the cart subtotal.</summary>
    FixedAmount,

    /// <summary>Waives the delivery fee.</summary>
    FreeShipping
}
