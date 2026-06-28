using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.Aggregates.PromoCode;

/// <summary>
/// A store-scoped discount coupon a shopper enters at checkout. Stored uppercased and unique per
/// store. Validation and discount calculation are owned by the aggregate so the rules cannot be
/// bypassed by callers.
/// </summary>
public sealed class PromoCode : AggregateRoot<PromoCodeId>
{
    public const int MaxCodeLength = 40;
    public const int MaxDescriptionLength = 500;

    public StoreId StoreId { get; private set; }
    public string Code { get; private set; } = null!;
    public string? Description { get; private set; }
    public PromoDiscountType DiscountType { get; private set; }
    public decimal Value { get; private set; }
    public decimal? MinimumOrderAmount { get; private set; }
    public decimal? MaxDiscountAmount { get; private set; }
    public DateTime? StartsAt { get; private set; }
    public DateTime? ExpiresAt { get; private set; }
    public int? UsageLimit { get; private set; }
    public int? UsageLimitPerCustomer { get; private set; }
    public int TimesUsed { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private PromoCode() : base(PromoCodeId.Empty) { }

    public static Result<PromoCode> Create(
        StoreId storeId,
        string code,
        string? description,
        PromoDiscountType discountType,
        decimal value,
        decimal? minimumOrderAmount,
        decimal? maxDiscountAmount,
        DateTime? startsAt,
        DateTime? expiresAt,
        int? usageLimit,
        int? usageLimitPerCustomer)
    {
        var normalized = Normalize(code);
        if (normalized is null)
            return Result.Failure<PromoCode>(PromoCodeErrors.CodeRequired);

        var validation = ValidateValue(discountType, value);
        if (validation.IsFailure)
            return Result.Failure<PromoCode>(validation.Error);

        var now = DateTime.UtcNow;
        var promo = new PromoCode
        {
            Id = PromoCodeId.New(),
            StoreId = storeId,
            Code = normalized,
            Description = Trim(description, MaxDescriptionLength),
            DiscountType = discountType,
            Value = discountType == PromoDiscountType.FreeShipping ? 0 : value,
            MinimumOrderAmount = minimumOrderAmount,
            MaxDiscountAmount = maxDiscountAmount,
            StartsAt = startsAt,
            ExpiresAt = expiresAt,
            UsageLimit = usageLimit,
            UsageLimitPerCustomer = usageLimitPerCustomer,
            TimesUsed = 0,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        return Result.Success(promo);
    }

    public Result Update(
        string? description,
        PromoDiscountType discountType,
        decimal value,
        decimal? minimumOrderAmount,
        decimal? maxDiscountAmount,
        DateTime? startsAt,
        DateTime? expiresAt,
        int? usageLimit,
        int? usageLimitPerCustomer)
    {
        var validation = ValidateValue(discountType, value);
        if (validation.IsFailure)
            return validation;

        Description = Trim(description, MaxDescriptionLength);
        DiscountType = discountType;
        Value = discountType == PromoDiscountType.FreeShipping ? 0 : value;
        MinimumOrderAmount = minimumOrderAmount;
        MaxDiscountAmount = maxDiscountAmount;
        StartsAt = startsAt;
        ExpiresAt = expiresAt;
        UsageLimit = usageLimit;
        UsageLimitPerCustomer = usageLimitPerCustomer;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public void Activate()
    {
        IsActive = true;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Checks whether this code may be redeemed for an order with the given subtotal.
    /// <paramref name="customerRedemptionCount"/> is how many times the redeeming customer has
    /// already used this code.
    /// </summary>
    public Result Validate(decimal subtotal, DateTime now, int customerRedemptionCount)
    {
        if (!IsActive)
            return Result.Failure(PromoCodeErrors.Inactive);

        if (StartsAt.HasValue && now < StartsAt.Value)
            return Result.Failure(PromoCodeErrors.NotStarted);

        if (ExpiresAt.HasValue && now > ExpiresAt.Value)
            return Result.Failure(PromoCodeErrors.Expired);

        if (MinimumOrderAmount.HasValue && subtotal < MinimumOrderAmount.Value)
            return Result.Failure(PromoCodeErrors.MinimumOrderNotMet);

        if (UsageLimit.HasValue && TimesUsed >= UsageLimit.Value)
            return Result.Failure(PromoCodeErrors.UsageLimitReached);

        if (UsageLimitPerCustomer.HasValue && customerRedemptionCount >= UsageLimitPerCustomer.Value)
            return Result.Failure(PromoCodeErrors.CustomerLimitReached);

        return Result.Success();
    }

    /// <summary>
    /// The monetary amount this code removes from the order total. For <see cref="PromoDiscountType.FreeShipping"/>
    /// this equals the delivery fee; for the others it applies to the subtotal (capped and never exceeding it).
    /// </summary>
    public decimal CalculateDiscount(decimal subtotal, decimal deliveryFee)
    {
        decimal discount = DiscountType switch
        {
            PromoDiscountType.Percentage => Math.Round(subtotal * Value / 100m, 2),
            PromoDiscountType.FixedAmount => Value,
            PromoDiscountType.FreeShipping => deliveryFee,
            _ => 0m
        };

        if (DiscountType != PromoDiscountType.FreeShipping)
        {
            if (MaxDiscountAmount.HasValue && discount > MaxDiscountAmount.Value)
                discount = MaxDiscountAmount.Value;

            if (discount > subtotal)
                discount = subtotal;
        }

        return discount < 0 ? 0 : discount;
    }

    public void RecordRedemption()
    {
        TimesUsed++;
        UpdatedAt = DateTime.UtcNow;
    }

    private static Result ValidateValue(PromoDiscountType discountType, decimal value)
    {
        switch (discountType)
        {
            case PromoDiscountType.Percentage when value is <= 0 or > 100:
                return Result.Failure(PromoCodeErrors.InvalidPercentage);
            case PromoDiscountType.FixedAmount when value <= 0:
                return Result.Failure(PromoCodeErrors.InvalidValue);
            default:
                return Result.Success();
        }
    }

    private static string? Normalize(string? code)
    {
        if (string.IsNullOrWhiteSpace(code))
            return null;

        code = code.Trim().ToUpperInvariant();
        return code.Length > MaxCodeLength ? code[..MaxCodeLength] : code;
    }

    private static string? Trim(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        value = value.Trim();
        return value.Length > maxLength ? value[..maxLength] : value;
    }
}
