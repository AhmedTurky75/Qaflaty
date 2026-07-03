using Qaflaty.Domain.Common.ValueObjects;
using Xunit;

namespace Qaflaty.UnitTests.Domain.Common;

public class CurrencyTests
{
    [Fact]
    public void FromCode_KnownCode_ReturnsRegistryEntry()
    {
        var currency = Currency.FromCode("EGP");

        Assert.Equal("EGP", currency.Code);
        Assert.Equal("Egyptian Pound", currency.EnglishName);
        Assert.Equal(2, currency.DecimalDigits);
    }

    [Theory]
    [InlineData("egp")]
    [InlineData("  egp  ")]
    [InlineData("Egp")]
    public void FromCode_IsCaseAndWhitespaceInsensitive(string code)
    {
        Assert.Equal("EGP", Currency.FromCode(code).Code);
    }

    [Fact]
    public void FromCode_ZeroDecimalCurrency_HasZeroDigits()
    {
        Assert.Equal(0, Currency.FromCode("JPY").DecimalDigits);
    }

    [Fact]
    public void FromCode_ThreeDecimalCurrency_HasThreeDigits()
    {
        Assert.Equal(3, Currency.FromCode("KWD").DecimalDigits);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void FromCode_BlankCode_FallsBackToDefaultEgp(string? code)
    {
        Assert.Equal("EGP", Currency.FromCode(code).Code);
    }

    [Fact]
    public void FromCode_UnknownCode_ReturnsMinimalEntryWithoutThrowing()
    {
        var currency = Currency.FromCode("XYZ");

        Assert.Equal("XYZ", currency.Code);
        Assert.Equal("XYZ", currency.EnglishName);
        Assert.Equal(2, currency.DecimalDigits);
    }

    [Fact]
    public void Default_IsEgp()
    {
        Assert.Equal("EGP", Currency.Default.Code);
    }

    [Theory]
    [InlineData("SAR", true)]
    [InlineData("usd", true)]
    [InlineData("XYZ", false)]
    [InlineData(null, false)]
    [InlineData("", false)]
    public void IsValidCode_ReflectsRegistryMembership(string? code, bool expected)
    {
        Assert.Equal(expected, Currency.IsValidCode(code));
    }

    [Fact]
    public void Equality_IsByCode()
    {
        Assert.Equal(Currency.FromCode("USD"), Currency.USD);
        Assert.True(Currency.FromCode("SAR") == Currency.SAR);
        Assert.NotEqual(Currency.EGP, Currency.USD);
    }

    [Fact]
    public void All_IsOrderedByCode()
    {
        var codes = Currency.All.Select(c => c.Code).ToList();

        Assert.Equal(codes.OrderBy(c => c, StringComparer.Ordinal), codes);
        Assert.NotEmpty(codes);
    }
}
