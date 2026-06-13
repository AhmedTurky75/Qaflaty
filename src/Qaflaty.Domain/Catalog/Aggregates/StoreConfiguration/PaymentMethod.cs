using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Domain.Catalog.Aggregates.StoreConfiguration;

public sealed class PaymentMethod
{
    public Guid Id { get; private set; }
    public string Key { get; private set; } = null!;
    public string Label { get; private set; } = null!;
    public string? Description { get; private set; }
    public bool IsEnabled { get; private set; }
    public bool IsDeleted { get; private set; }
    public FeeAdjustmentType FeeType { get; private set; }
    public decimal FeeValue { get; private set; }
    public int SortOrder { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private PaymentMethod() { }

    public static Result<PaymentMethod> Create(
        string key,
        string label,
        FeeAdjustmentType feeType = FeeAdjustmentType.None,
        decimal feeValue = 0m,
        string? description = null,
        int sortOrder = 0)
    {
        if (string.IsNullOrWhiteSpace(key))
            return Result.Failure<PaymentMethod>(
                new Error("PaymentMethod.InvalidKey", "Payment method key cannot be empty"));

        if (string.IsNullOrWhiteSpace(label))
            return Result.Failure<PaymentMethod>(
                new Error("PaymentMethod.InvalidLabel", "Payment method label cannot be empty"));

        if (feeType == FeeAdjustmentType.Percentage && (feeValue < -100 || feeValue > 100))
            return Result.Failure<PaymentMethod>(
                new Error("PaymentMethod.InvalidPercentage", "Percentage fee must be between -100 and 100"));

        var now = DateTime.UtcNow;
        return Result.Success(new PaymentMethod
        {
            Id = Guid.NewGuid(),
            Key = key.Trim(),
            Label = label.Trim(),
            Description = description?.Trim(),
            IsEnabled = true,
            IsDeleted = false,
            FeeType = feeType,
            FeeValue = feeValue,
            SortOrder = sortOrder,
            CreatedAt = now,
            UpdatedAt = now
        });
    }

    public Result Update(string label, string? description, FeeAdjustmentType feeType, decimal feeValue, bool isEnabled, int sortOrder)
    {
        if (string.IsNullOrWhiteSpace(label))
            return Result.Failure(new Error("PaymentMethod.InvalidLabel", "Payment method label cannot be empty"));

        if (feeType == FeeAdjustmentType.Percentage && (feeValue < -100 || feeValue > 100))
            return Result.Failure(new Error("PaymentMethod.InvalidPercentage", "Percentage fee must be between -100 and 100"));

        Label = label.Trim();
        Description = description?.Trim();
        FeeType = feeType;
        FeeValue = feeValue;
        IsEnabled = isEnabled;
        SortOrder = sortOrder;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public void SetEnabled(bool isEnabled)
    {
        IsEnabled = isEnabled;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SoftDelete()
    {
        IsDeleted = true;
        IsEnabled = false;
        UpdatedAt = DateTime.UtcNow;
    }

    public decimal CalculateFee(decimal subtotal) => FeeType switch
    {
        FeeAdjustmentType.Fixed      => FeeValue,
        FeeAdjustmentType.Percentage => Math.Round(subtotal * FeeValue / 100, 2),
        _                            => 0m
    };
}
