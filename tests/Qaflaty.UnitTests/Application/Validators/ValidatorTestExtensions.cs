using FluentValidation;
using FluentValidation.Results;
using Xunit;

namespace Qaflaty.UnitTests.Application.Validators;

/// <summary>
/// Small assertion helpers over FluentValidation's <see cref="ValidationResult"/> so validator
/// tests read clearly without taking a dependency on FluentValidation.TestHelper.
/// </summary>
internal static class ValidatorTestExtensions
{
    public static ValidationResult ValidateCommand<T>(this IValidator<T> validator, T command)
        => validator.Validate(command);

    public static void ShouldBeValid(this ValidationResult result)
    {
        Assert.True(result.IsValid,
            "Expected the command to be valid but got errors: " +
            string.Join("; ", result.Errors.Select(e => $"{e.PropertyName}: {e.ErrorMessage}")));
    }

    public static void ShouldBeInvalid(this ValidationResult result)
        => Assert.False(result.IsValid);

    public static void ShouldHaveErrorFor(this ValidationResult result, string propertyName)
    {
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == propertyName);
    }

    /// <summary>Asserts an error exists whose property path starts with the given prefix (for nested/collection rules).</summary>
    public static void ShouldHaveErrorStartingWith(this ValidationResult result, string propertyPrefix)
    {
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.StartsWith(propertyPrefix, StringComparison.Ordinal));
    }

    public static void ShouldNotHaveErrorFor(this ValidationResult result, string propertyName)
    {
        Assert.DoesNotContain(result.Errors, e => e.PropertyName == propertyName);
    }
}
