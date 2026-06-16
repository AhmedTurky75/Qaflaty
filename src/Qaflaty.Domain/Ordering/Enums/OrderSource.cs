namespace Qaflaty.Domain.Ordering.Enums;

/// <summary>Channel through which an order was placed.</summary>
public enum OrderSource
{
    Storefront = 1,

    /// <summary>Placed on the customer's behalf by the AI shopping assistant.</summary>
    ChatAssistant = 2
}
