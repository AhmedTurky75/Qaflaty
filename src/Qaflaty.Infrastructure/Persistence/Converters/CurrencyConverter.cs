using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Qaflaty.Domain.Common.ValueObjects;

namespace Qaflaty.Infrastructure.Persistence.Converters;

/// <summary>
/// Persists a <see cref="Currency"/> value object as its ISO 4217 code string (e.g. "EGP").
/// The rest of the currency metadata (symbol, name, decimal digits) is resolved from the
/// registry on read via <see cref="Currency.FromCode"/>, so only the code is stored.
/// </summary>
public sealed class CurrencyConverter : ValueConverter<Currency, string>
{
    public CurrencyConverter()
        : base(
            currency => currency.Code,
            code => Currency.FromCode(code))
    {
    }
}
