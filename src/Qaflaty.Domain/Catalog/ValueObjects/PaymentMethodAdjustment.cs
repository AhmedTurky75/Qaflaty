using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Domain.Catalog.ValueObjects;

/// <summary>
/// Defines a fee surcharge or discount applied when a customer selects a specific payment method.
/// Value is positive for surcharges (e.g. COD +20 SAR) and negative for discounts (e.g. Visa -5%).
/// </summary>
public sealed class PaymentMethodAdjustment
{
    public Guid Id { get; private set; }

    /// <summary>The payment method key, e.g. "COD", "Visa". Matches PaymentMethodDefinition.Key.</summary>
    public string PaymentMethodKey { get; private set; } = null!;

    public FeeAdjustmentType AdjustmentType { get; private set; }

    /// <summary>
    /// The adjustment amount.
    /// For <see cref="FeeAdjustmentType.Fixed"/>: absolute monetary value in the store's currency.
    /// For <see cref="FeeAdjustmentType.Percentage"/>: a percentage value (e.g. -5 = 5% discount, 10 = 10% surcharge).
    /// </summary>
    public decimal Value { get; private set; }

    /// <summary>Optional display label shown to customers at checkout, e.g. "Pay with Visa and save 5%".</summary>
    public string? DisplayLabel { get; private set; }

    /// <summary>Whether this payment method is available for customers to choose at checkout.</summary>
    public bool IsEnabled { get; private set; }

    private PaymentMethodAdjustment() { }

    public static Result<PaymentMethodAdjustment> Create(
        string paymentMethodKey,
        FeeAdjustmentType adjustmentType,
        decimal value,
        string? displayLabel = null,
        bool isEnabled = true)
    {
        if (string.IsNullOrWhiteSpace(paymentMethodKey))
            return Result.Failure<PaymentMethodAdjustment>(
                new Error("PaymentMethodAdjustment.InvalidKey", "Payment method key cannot be empty"));

        if (adjustmentType == FeeAdjustmentType.Percentage && (value < -100 || value > 100))
            return Result.Failure<PaymentMethodAdjustment>(
                new Error("PaymentMethodAdjustment.InvalidPercentage",
                    "Percentage adjustment must be between -100 and 100"));

        return Result.Success(new PaymentMethodAdjustment
        {
            Id = Guid.NewGuid(),
            PaymentMethodKey = paymentMethodKey.Trim(),
            AdjustmentType = adjustmentType,
            Value = value,
            DisplayLabel = displayLabel?.Trim(),
            IsEnabled = isEnabled
        });
    }

    /// <summary>
    /// Calculates the actual adjustment amount given an order subtotal.
    /// Returns a positive number for surcharges and a negative number for discounts.
    /// </summary>
    public decimal CalculateAmount(decimal orderSubtotal)
    {
        return AdjustmentType == FeeAdjustmentType.Percentage
            ? Math.Round(orderSubtotal * Value / 100, 2)
            : Value;
    }
}
