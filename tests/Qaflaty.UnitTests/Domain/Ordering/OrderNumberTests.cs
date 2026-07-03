using System.Text.RegularExpressions;
using Qaflaty.Domain.Ordering.ValueObjects;
using Xunit;

namespace Qaflaty.UnitTests.Domain.Ordering;

public class OrderNumberTests
{
    [Fact]
    public void Generate_ProducesQafFormat()
    {
        var orderNumber = OrderNumber.Generate();

        Assert.Matches(new Regex(@"^QAF-\d{6}$"), orderNumber.Value);
    }

    [Theory]
    [InlineData("QAF-123456")]
    [InlineData("QAF-000001")]
    public void Parse_ValidFormat_Succeeds(string value)
    {
        var result = OrderNumber.Parse(value);

        Assert.True(result.IsSuccess);
        Assert.Equal(value, result.Value.Value);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("QAF-12345")]    // 5 digits
    [InlineData("QAF-1234567")]  // 7 digits
    [InlineData("qaf-123456")]   // lowercase
    [InlineData("ORD-123456")]   // wrong prefix
    [InlineData("QAF123456")]    // missing hyphen
    public void Parse_InvalidFormat_Fails(string value)
    {
        var result = OrderNumber.Parse(value);

        Assert.True(result.IsFailure);
        Assert.Equal("Ordering.InvalidOrderNumber", result.Error.Code);
    }

    [Fact]
    public void Equality_IsByValue()
    {
        var a = OrderNumber.Parse("QAF-555555").Value;
        var b = OrderNumber.Parse("QAF-555555").Value;

        Assert.Equal(a, b);
        Assert.True(a == b);
    }
}
