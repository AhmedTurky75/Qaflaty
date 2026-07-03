using Qaflaty.Application.Identity.Commands.ChangePassword;
using Qaflaty.Application.Identity.Commands.Register;
using Xunit;

namespace Qaflaty.UnitTests.Application.Validators;

public class RegisterCommandValidatorTests
{
    private static readonly RegisterCommandValidator Validator = new();

    private static RegisterCommand Valid(
        string email = "owner@shop.com",
        string password = "Passw0rd",
        string firstName = "Ahmed",
        string lastName = "Ali",
        string username = "ahmed_ali",
        string? phone = null)
        => new(email, password, firstName, lastName, username, phone);

    [Fact]
    public void Valid_Passes() => Validator.ValidateCommand(Valid()).ShouldBeValid();

    [Theory]
    [InlineData("")]
    [InlineData("not-email")]
    public void InvalidEmail_Fails(string email)
        => Validator.ValidateCommand(Valid(email: email)).ShouldHaveErrorFor("Email");

    [Theory]
    [InlineData("short1A")]   // < 8 chars
    [InlineData("alllower1")] // no uppercase
    [InlineData("ALLUPPER1")] // no lowercase
    [InlineData("NoNumber")]  // no digit
    public void WeakPassword_Fails(string password)
        => Validator.ValidateCommand(Valid(password: password)).ShouldHaveErrorFor("Password");

    [Theory]
    [InlineData("")]
    [InlineData("ab")]           // too short
    [InlineData("has space")]    // invalid chars
    public void InvalidUsername_Fails(string username)
        => Validator.ValidateCommand(Valid(username: username)).ShouldHaveErrorFor("Username");

    [Fact]
    public void ShortFirstName_Fails()
        => Validator.ValidateCommand(Valid(firstName: "A")).ShouldHaveErrorFor("FirstName");

    [Fact]
    public void InvalidPhoneWhenProvided_Fails()
        => Validator.ValidateCommand(Valid(phone: "abc")).ShouldHaveErrorFor("Phone");

    [Fact]
    public void NullPhone_IsAllowed()
        => Validator.ValidateCommand(Valid(phone: null)).ShouldNotHaveErrorFor("Phone");
}

public class ChangePasswordCommandValidatorTests
{
    private static readonly ChangePasswordCommandValidator Validator = new();

    [Fact]
    public void Valid_Passes()
        => Validator.ValidateCommand(new ChangePasswordCommand("OldPass1", "NewPass1")).ShouldBeValid();

    [Fact]
    public void EmptyCurrentPassword_Fails()
        => Validator.ValidateCommand(new ChangePasswordCommand("", "NewPass1")).ShouldHaveErrorFor("CurrentPassword");

    [Fact]
    public void WeakNewPassword_Fails()
        => Validator.ValidateCommand(new ChangePasswordCommand("OldPass1", "weak")).ShouldHaveErrorFor("NewPassword");

    [Fact]
    public void NewPasswordEqualToCurrent_Fails()
        => Validator.ValidateCommand(new ChangePasswordCommand("SamePass1", "SamePass1")).ShouldHaveErrorFor("NewPassword");
}
