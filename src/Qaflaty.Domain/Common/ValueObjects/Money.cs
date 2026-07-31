using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Common.ValueObjects;

/// <summary>
/// A monetary amount. Currency is NOT stored here — a store has exactly one currency
/// (see <see cref="Qaflaty.Domain.Catalog.Aggregates.Store.Store.Currency"/>), so every
/// amount within a store is implicitly in that currency. This keeps a single source of
/// truth and removes redundant per-amount currency columns.
/// </summary>
public sealed class Money : ValueObject
{
    public decimal Amount { get; private init; } // Monetary amount, always non-negative (validated in Create), e.g. 199.99

    private Money(decimal amount)
    {
        Amount = amount;
    }

    public static Result<Money> Create(decimal amount)
    {
        if (amount < 0)
            return Result.Failure<Money>(new Error("Money.NegativeAmount", "Amount cannot be negative"));

        return Result.Success(new Money(amount));
    }

    public static Money Zero() => new(0);

    public Money Add(Money other) => new(Amount + other.Amount);

    public Money Subtract(Money other)
    {
        if (Amount < other.Amount)
            throw new InvalidOperationException("Subtraction result would be negative");

        return new Money(Amount - other.Amount);
    }

    public Money Multiply(decimal factor)
    {
        if (factor < 0)
            throw new ArgumentException("Factor cannot be negative", nameof(factor));

        return new Money(Amount * factor);
    }

    public static Money operator +(Money left, Money right) => left.Add(right);
    public static Money operator -(Money left, Money right) => left.Subtract(right);
    public static Money operator *(Money money, decimal factor) => money.Multiply(factor);
    public static Money operator *(decimal factor, Money money) => money.Multiply(factor);

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Amount;
    }

    public override string ToString() => $"{Amount:N2}";
}
