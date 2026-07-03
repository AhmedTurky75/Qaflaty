using Qaflaty.Domain.Common.ValueObjects;
using Xunit;

namespace Qaflaty.UnitTests.Domain.Common;

public class PhoneNumberTests
{
    [Fact]
    public void Create_ValidEgyptianMobile_NormalizesToE164()
    {
        var result = PhoneNumber.Create("01012345678", "EG");

        Assert.True(result.IsSuccess);
        Assert.Equal("+201012345678", result.Value.Value);
        Assert.Equal("EG", result.Value.CountryCode);
    }

    [Fact]
    public void Create_LowercaseRegion_IsUppercased()
    {
        var result = PhoneNumber.Create("01012345678", "eg");

        Assert.True(result.IsSuccess);
        Assert.Equal("EG", result.Value.CountryCode);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_BlankPhone_Fails(string? phone)
    {
        var result = PhoneNumber.Create(phone!, "EG");

        Assert.True(result.IsFailure);
        Assert.Equal("PhoneNumber.Empty", result.Error.Code);
    }

    [Theory]
    [InlineData("E")]
    [InlineData("EGY")]
    [InlineData("")]
    public void Create_InvalidCountryCodeLength_Fails(string region)
    {
        var result = PhoneNumber.Create("01012345678", region);

        Assert.True(result.IsFailure);
        Assert.Equal("PhoneNumber.InvalidCountryCode", result.Error.Code);
    }

    [Fact]
    public void Create_NumberInvalidForRegion_Fails()
    {
        var result = PhoneNumber.Create("123", "EG");

        Assert.True(result.IsFailure);
        Assert.Equal("PhoneNumber.InvalidForRegion", result.Error.Code);
    }

    [Fact]
    public void CreateFromE164_ValidE164_Succeeds()
    {
        var result = PhoneNumber.CreateFromE164("+201012345678");

        Assert.True(result.IsSuccess);
        Assert.Equal("+201012345678", result.Value.Value);
        Assert.Null(result.Value.CountryCode);
    }

    [Fact]
    public void CreateFromE164_MissingPlus_Fails()
    {
        var result = PhoneNumber.CreateFromE164("201012345678");

        Assert.True(result.IsFailure);
        Assert.Equal("PhoneNumber.InvalidE164", result.Error.Code);
    }

    [Fact]
    public void Equality_IsByValue()
    {
        var a = PhoneNumber.Create("01012345678", "EG").Value;
        var b = PhoneNumber.CreateFromE164("+201012345678").Value;

        // Equality is defined by the E.164 value only, regardless of how it was created.
        Assert.Equal(a, b);
        Assert.True(a == b);
    }
}
