using Qaflaty.Application.Ordering.Commands.PlaceOrder;
using Qaflaty.Application.Ordering.Commands.VerifyOrderOtp;
using Xunit;

namespace Qaflaty.UnitTests.Application.Validators;

public class PlaceOrderCommandValidatorTests
{
    private static PlaceOrderCommand Valid(
        string name = "Ahmed Ali",
        string phone = "+201012345678",
        string email = "buyer@example.com",
        string street = "King Fahd Rd",
        string city = "Riyadh",
        string paymentMethod = "COD",
        List<PlaceOrderItemDto>? items = null)
        => new(
            StoreId: Guid.NewGuid(),
            CustomerName: name,
            CustomerPhone: phone,
            CustomerPhoneCountryCode: "EG",
            CustomerEmail: email,
            Street: street,
            City: city,
            District: null,
            Country: "Egypt",
            DeliveryInstructions: null,
            CustomerNotes: null,
            PaymentMethod: paymentMethod,
            Items: items ?? [new PlaceOrderItemDto(Guid.NewGuid(), 1, null)]);

    private static readonly PlaceOrderCommandValidator Validator = new();

    [Fact]
    public void Valid_Command_Passes()
        => Validator.ValidateCommand(Valid()).ShouldBeValid();

    [Fact]
    public void EmptyStoreId_Fails()
        => Validator.ValidateCommand(Valid() with { StoreId = Guid.Empty }).ShouldHaveErrorFor("StoreId");

    [Theory]
    [InlineData("")]
    [InlineData("A")] // below min length 2
    public void InvalidCustomerName_Fails(string name)
        => Validator.ValidateCommand(Valid(name: name)).ShouldHaveErrorFor("CustomerName");

    [Theory]
    [InlineData("")]
    [InlineData("123")]        // too short
    [InlineData("abcdefghij")] // non-digit
    public void InvalidPhone_Fails(string phone)
        => Validator.ValidateCommand(Valid(phone: phone)).ShouldHaveErrorFor("CustomerPhone");

    [Theory]
    [InlineData("")]
    [InlineData("not-an-email")]
    public void InvalidEmail_Fails(string email)
        => Validator.ValidateCommand(Valid(email: email)).ShouldHaveErrorFor("CustomerEmail");

    [Fact]
    public void MissingStreetOrCity_Fails()
    {
        Validator.ValidateCommand(Valid(street: "")).ShouldHaveErrorFor("Street");
        Validator.ValidateCommand(Valid(city: "")).ShouldHaveErrorFor("City");
    }

    [Fact]
    public void EmptyPaymentMethod_Fails()
        => Validator.ValidateCommand(Valid(paymentMethod: "")).ShouldHaveErrorFor("PaymentMethod");

    [Fact]
    public void NoItems_Fails()
        => Validator.ValidateCommand(Valid(items: [])).ShouldHaveErrorFor("Items");

    [Fact]
    public void ItemWithZeroQuantity_Fails()
    {
        var cmd = Valid(items: [new PlaceOrderItemDto(Guid.NewGuid(), 0, null)]);

        Validator.ValidateCommand(cmd).ShouldHaveErrorStartingWith("Items[0].Quantity");
    }
}

public class VerifyOrderOtpCommandValidatorTests
{
    private static readonly VerifyOrderOtpCommandValidator Validator = new();

    private static VerifyOrderOtpCommand Valid(string otp = "123456", string orderNumber = "QAF-123456")
        => new(Guid.NewGuid(), orderNumber, otp);

    [Fact]
    public void Valid_Passes() => Validator.ValidateCommand(Valid()).ShouldBeValid();

    [Fact]
    public void EmptyStoreId_Fails()
        => Validator.ValidateCommand(Valid() with { StoreId = Guid.Empty }).ShouldHaveErrorFor("StoreId");

    [Fact]
    public void EmptyOrderNumber_Fails()
        => Validator.ValidateCommand(Valid(orderNumber: "")).ShouldHaveErrorFor("OrderNumber");

    [Theory]
    [InlineData("")]
    [InlineData("12345")]   // 5 digits
    [InlineData("1234567")] // 7 digits
    [InlineData("12a456")]  // non-digit
    public void InvalidOtp_Fails(string otp)
        => Validator.ValidateCommand(Valid(otp: otp)).ShouldHaveErrorFor("OtpCode");
}
