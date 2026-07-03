using Qaflaty.Domain.Common.ValueObjects;
using Xunit;

namespace Qaflaty.UnitTests.Domain.Common;

public class EmailTests
{
    [Theory]
    [InlineData("user@example.com")]
    [InlineData("a.b+tag@sub.domain.co")]
    public void Create_ValidEmail_Succeeds(string input)
    {
        var result = Email.Create(input);

        Assert.True(result.IsSuccess);
        Assert.Equal(input.ToLowerInvariant(), result.Value.Value);
    }

    [Fact]
    public void Create_TrimsAndLowercases()
    {
        var result = Email.Create("  User@Example.COM  ");

        Assert.True(result.IsSuccess);
        Assert.Equal("user@example.com", result.Value.Value);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_Blank_Fails(string? input)
    {
        var result = Email.Create(input!);

        Assert.True(result.IsFailure);
        Assert.Equal("Email.Empty", result.Error.Code);
    }

    [Theory]
    [InlineData("notanemail")]
    [InlineData("missing@domain")]
    [InlineData("@nolocal.com")]
    [InlineData("spaces in@email.com")]
    [InlineData("two@@at.com")]
    public void Create_InvalidFormat_Fails(string input)
    {
        var result = Email.Create(input);

        Assert.True(result.IsFailure);
        Assert.Equal("Email.InvalidFormat", result.Error.Code);
    }

    [Fact]
    public void Create_TooLong_Fails()
    {
        var longLocal = new string('a', 250);
        var result = Email.Create($"{longLocal}@ex.com");

        Assert.True(result.IsFailure);
        Assert.Equal("Email.TooLong", result.Error.Code);
    }

    [Fact]
    public void Equality_IsByNormalizedValue()
    {
        var a = Email.Create("User@Example.com").Value;
        var b = Email.Create("user@example.com").Value;

        Assert.Equal(a, b);
        Assert.True(a == b);
    }
}
