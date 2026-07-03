using Qaflaty.Domain.Identity.ValueObjects;
using Xunit;

namespace Qaflaty.UnitTests.Domain.Identity;

public class PersonNameTests
{
    [Fact]
    public void Create_Valid_TrimsAndComposesFullName()
    {
        var result = PersonName.Create("  Ahmed ", " Ali ");

        Assert.True(result.IsSuccess);
        Assert.Equal("Ahmed", result.Value.FirstName);
        Assert.Equal("Ali", result.Value.LastName);
        Assert.Equal("Ahmed Ali", result.Value.FullName);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_BlankFirstName_Fails(string? first)
    {
        var result = PersonName.Create(first!, "Ali");

        Assert.True(result.IsFailure);
        Assert.Equal("Identity.FirstNameRequired", result.Error.Code);
    }

    [Theory]
    [InlineData("A")]                 // too short
    [InlineData("abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz1")] // 51 chars
    public void Create_FirstNameWrongLength_Fails(string first)
    {
        var result = PersonName.Create(first, "Ali");

        Assert.True(result.IsFailure);
        Assert.Equal("Identity.FirstNameInvalidLength", result.Error.Code);
    }

    [Fact]
    public void Create_BlankLastName_Fails()
    {
        var result = PersonName.Create("Ahmed", "  ");

        Assert.True(result.IsFailure);
        Assert.Equal("Identity.LastNameRequired", result.Error.Code);
    }

    [Fact]
    public void CreateFromFullName_SplitsOnFirstSpace()
    {
        var result = PersonName.CreateFromFullName("Ahmed Ali Hassan");

        Assert.True(result.IsSuccess);
        Assert.Equal("Ahmed", result.Value.FirstName);
        Assert.Equal("Ali Hassan", result.Value.LastName);
    }

    [Fact]
    public void CreateFromFullName_SingleWord_UsesItForBoth()
    {
        var result = PersonName.CreateFromFullName("Ahmed");

        Assert.True(result.IsSuccess);
        Assert.Equal("Ahmed", result.Value.FirstName);
        Assert.Equal("Ahmed", result.Value.LastName);
    }

    [Fact]
    public void CreateFromFullName_Blank_Fails()
    {
        var result = PersonName.CreateFromFullName("   ");

        Assert.True(result.IsFailure);
        Assert.Equal("Identity.NameRequired", result.Error.Code);
    }

    [Fact]
    public void Equality_IsByFirstAndLast()
    {
        var a = PersonName.Create("Ahmed", "Ali").Value;
        var b = PersonName.Create("Ahmed", "Ali").Value;

        Assert.Equal(a, b);
    }
}
