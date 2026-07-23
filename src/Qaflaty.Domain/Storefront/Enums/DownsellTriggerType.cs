namespace Qaflaty.Domain.Storefront.Enums;

/// <summary>
/// A behavioral signal that may indicate a customer is about to abandon a purchase. These are
/// probabilistic signals, not guarantees — multiple types may be enabled simultaneously.
/// </summary>
public enum DownsellTriggerType
{
    /// <summary>Customer's cursor leaves toward the browser chrome on the Product Details page (desktop only).</summary>
    ExitIntentPdp = 0,

    /// <summary>Customer stays on the Product Details page for the configured duration without adding to cart.</summary>
    DwellTimePdp = 1,

    /// <summary>Customer removes a product from the shopping cart.</summary>
    CartItemRemoved = 2,

    /// <summary>Customer is inactive on the shopping cart page for the configured duration.</summary>
    CartInactivity = 3
}
