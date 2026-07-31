using Qaflaty.Application.Identity.Commands.AdminResetPassword;
using Qaflaty.Application.Identity.Commands.InitiateCustomerLogin;
using Qaflaty.Application.Identity.Commands.InitiateMerchantLogin;
using Qaflaty.Application.Identity.Commands.InviteTeamMember;
using Qaflaty.Application.Identity.Commands.Login;
using Qaflaty.Application.Identity.Commands.LoginStoreCustomer;
using Qaflaty.Application.Identity.Commands.RefreshToken;
using Qaflaty.Application.Identity.Commands.RegisterStoreCustomer;
using Qaflaty.Domain.Identity.Enums;
using Xunit;

namespace Qaflaty.UnitTests.Application.Validators;

public class LoginCommandValidatorTests
{
    private static readonly LoginCommandValidator Validator = new();

    [Fact]
    public void Valid_Passes()
        => Validator.ValidateCommand(new LoginCommand("owner@shop.com", "secret")).ShouldBeValid();

    [Theory]
    [InlineData("")]
    [InlineData("not-email")]
    public void InvalidEmail_Fails(string email)
        => Validator.ValidateCommand(new LoginCommand(email, "secret")).ShouldHaveErrorFor("Email");

    [Fact]
    public void EmptyPassword_Fails()
        => Validator.ValidateCommand(new LoginCommand("owner@shop.com", "")).ShouldHaveErrorFor("Password");
}

public class RefreshTokenCommandValidatorTests
{
    private static readonly RefreshTokenCommandValidator Validator = new();

    [Fact]
    public void Valid_Passes()
        => Validator.ValidateCommand(new RefreshTokenCommand("token-abc")).ShouldBeValid();

    [Fact]
    public void EmptyToken_Fails()
        => Validator.ValidateCommand(new RefreshTokenCommand("")).ShouldHaveErrorFor("RefreshToken");
}

public class InitiateMerchantLoginCommandValidatorTests
{
    private static readonly InitiateMerchantLoginCommandValidator Validator = new();

    [Fact]
    public void Valid_Passes()
        => Validator.ValidateCommand(new InitiateMerchantLoginCommand("ahmed", "pass")).ShouldBeValid();

    [Fact]
    public void EmptyEmailOrUsername_Fails()
        => Validator.ValidateCommand(new InitiateMerchantLoginCommand("", "pass")).ShouldHaveErrorFor("EmailOrUsername");

    [Fact]
    public void EmptyPassword_Fails()
        => Validator.ValidateCommand(new InitiateMerchantLoginCommand("ahmed", "")).ShouldHaveErrorFor("Password");
}

public class InitiateCustomerLoginCommandValidatorTests
{
    private static readonly InitiateCustomerLoginCommandValidator Validator = new();

    [Fact]
    public void Valid_Passes()
        => Validator.ValidateCommand(new InitiateCustomerLoginCommand("cust", "pass")).ShouldBeValid();

    [Fact]
    public void EmptyEmailOrUsername_Fails()
        => Validator.ValidateCommand(new InitiateCustomerLoginCommand("", "pass")).ShouldHaveErrorFor("EmailOrUsername");
}

public class LoginStoreCustomerCommandValidatorTests
{
    private static readonly LoginStoreCustomerCommandValidator Validator = new();

    [Fact]
    public void Valid_Passes()
        => Validator.ValidateCommand(new LoginStoreCustomerCommand("cust", "pass")).ShouldBeValid();

    [Fact]
    public void EmptyPassword_Fails()
        => Validator.ValidateCommand(new LoginStoreCustomerCommand("cust", "")).ShouldHaveErrorFor("Password");
}

public class AdminResetPasswordCommandValidatorTests
{
    private static readonly AdminResetPasswordCommandValidator Validator = new();

    [Fact]
    public void Valid_Passes()
        => Validator.ValidateCommand(new AdminResetPasswordCommand(Guid.NewGuid(), Guid.NewGuid(), "newpass1")).ShouldBeValid();

    [Theory]
    [InlineData("")]
    [InlineData("short")]
    public void WeakNewPassword_Fails(string password)
        => Validator.ValidateCommand(new AdminResetPasswordCommand(Guid.NewGuid(), Guid.NewGuid(), password)).ShouldHaveErrorFor("NewPassword");
}

public class InviteTeamMemberCommandValidatorTests
{
    private static readonly InviteTeamMemberCommandValidator Validator = new();

    private static InviteTeamMemberCommand Valid(
        string email = "member@shop.com",
        string username = "member_1",
        MerchantRole role = MerchantRole.Staff)
        => new(Guid.NewGuid(), email, "Passw0rd", "First", "Last", username, null, null, role);

    [Fact]
    public void Valid_Passes() => Validator.ValidateCommand(Valid()).ShouldBeValid();

    [Fact]
    public void OwnerRole_IsRejected()
        => Validator.ValidateCommand(Valid(role: MerchantRole.Owner)).ShouldHaveErrorFor("Role");

    [Theory]
    [InlineData(MerchantRole.Admin)]
    [InlineData(MerchantRole.Manager)]
    [InlineData(MerchantRole.Staff)]
    public void NonOwnerRoles_Allowed(MerchantRole role)
        => Validator.ValidateCommand(Valid(role: role)).ShouldBeValid();

    [Fact]
    public void UsernameWithHyphen_Fails()
        => Validator.ValidateCommand(Valid(username: "member-1")).ShouldHaveErrorFor("Username"); // hyphen not allowed here

    [Fact]
    public void InvalidEmail_Fails()
        => Validator.ValidateCommand(Valid(email: "bad")).ShouldHaveErrorFor("Email");
}

public class RegisterStoreCustomerCommandValidatorTests
{
    private static readonly RegisterStoreCustomerCommandValidator Validator = new();

    private static RegisterStoreCustomerCommand Valid(
        string email = "cust@shop.com",
        string password = "Passw0rd",
        string username = "cust_1",
        string? phone = null)
        => new(email, password, "First", "Last", username, phone);

    [Fact]
    public void Valid_Passes() => Validator.ValidateCommand(Valid()).ShouldBeValid();

    [Theory]
    [InlineData("nouppercase1")]
    [InlineData("NOLOWER1")]
    [InlineData("NoDigits")]
    public void WeakPassword_Fails(string password)
        => Validator.ValidateCommand(Valid(password: password)).ShouldHaveErrorFor("Password");

    [Fact]
    public void InvalidPhoneWhenProvided_Fails()
        => Validator.ValidateCommand(Valid(phone: "abc")).ShouldHaveErrorFor("Phone");
}
