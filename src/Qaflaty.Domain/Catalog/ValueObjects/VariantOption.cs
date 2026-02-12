using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

/// <summary>
/// Represents a variant option (e.g., "Color" with values ["Red", "Blue", "Green"])
/// </summary>
public sealed class VariantOption : ValueObject
{
    public string Name { get; private init; } = string.Empty;
    public List<string> Values { get; private init; } = [];

    private VariantOption() { }

    public static Result<VariantOption> Create(string name, List<string> values)
    {
        if (string.IsNullOrWhiteSpace(name))
            return Result.Failure<VariantOption>(
                new Error("VariantOption.NameRequired", "Variant option name is required"));

        if (values == null || values.Count == 0)
            return Result.Failure<VariantOption>(
                new Error("VariantOption.ValuesRequired", "Variant option must have at least one value"));

        // Remove duplicates and empty values
        var cleanedValues = values
            .Where(v => !string.IsNullOrWhiteSpace(v))
            .Select(v => v.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (cleanedValues.Count == 0)
            return Result.Failure<VariantOption>(
                new Error("VariantOption.NoValidValues", "Variant option has no valid values"));

        return Result.Success(new VariantOption
        {
            Name = name.Trim(),
            Values = cleanedValues
        });
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Name;
        foreach (var value in Values.OrderBy(v => v))
            yield return value;
    }
}
