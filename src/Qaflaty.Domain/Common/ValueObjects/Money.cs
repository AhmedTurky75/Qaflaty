using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Common.ValueObjects;

public sealed class Money : ValueObject
{
    public decimal Amount { get; private init; } // Monetary amount, always non-negative (validated in Create), e.g. 199.99
    public Currency Currency { get; private init; } // Currency of the amount (the owning store's currency). Arithmetic across different currencies is rejected

    private Money(decimal amount, Currency currency)
    {
        Amount = amount;
        Currency = currency;
    }

    public static Result<Money> Create(decimal amount, Currency? currency = null)
    {
        if (amount < 0)
            return Result.Failure<Money>(new Error("Money.NegativeAmount", "Amount cannot be negative"));

        return Result.Success(new Money(amount, currency ?? Currency.Default));
    }

    public static Money Zero(Currency? currency = null) => new(0, currency ?? Currency.Default);

    public Money Add(Money other)
    {
        if (Currency != other.Currency)
            throw new InvalidOperationException("Cannot add money with different currencies");

        return new Money(Amount + other.Amount, Currency);
    }

    public Money Subtract(Money other)
    {
        if (Currency != other.Currency)
            throw new InvalidOperationException("Cannot subtract money with different currencies");

        if (Amount < other.Amount)
            throw new InvalidOperationException("Subtraction result would be negative");

        return new Money(Amount - other.Amount, Currency);
    }

    public Money Multiply(decimal factor)
    {
        if (factor < 0)
            throw new ArgumentException("Factor cannot be negative", nameof(factor));

        return new Money(Amount * factor, Currency);
    }

    public static Money operator +(Money left, Money right) => left.Add(right);
    public static Money operator -(Money left, Money right) => left.Subtract(right);
    public static Money operator *(Money money, decimal factor) => money.Multiply(factor);
    public static Money operator *(decimal factor, Money money) => money.Multiply(factor);

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Amount;
        yield return Currency;
    }

    public override string ToString() => $"{Amount:N2} {Currency}";
}
