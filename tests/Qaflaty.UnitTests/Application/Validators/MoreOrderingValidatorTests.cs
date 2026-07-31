using Qaflaty.Application.Ordering.Commands.AddOrderNote;
using Qaflaty.Application.Ordering.Commands.CancelOrder;
using Qaflaty.Application.Ordering.Commands.SendOrderOtp;
using Qaflaty.Application.Ordering.Commands.UpdateCustomerNotes;
using Xunit;

namespace Qaflaty.UnitTests.Application.Validators;

public class CancelOrderCommandValidatorTests
{
    private static readonly CancelOrderCommandValidator Validator = new();

    [Fact]
    public void Valid_Passes()
        => Validator.ValidateCommand(new CancelOrderCommand(Guid.NewGuid(), "Out of stock")).ShouldBeValid();

    [Fact]
    public void EmptyOrderId_Fails()
        => Validator.ValidateCommand(new CancelOrderCommand(Guid.Empty, "reason")).ShouldHaveErrorFor("OrderId");

    [Fact]
    public void EmptyReason_Fails()
        => Validator.ValidateCommand(new CancelOrderCommand(Guid.NewGuid(), "")).ShouldHaveErrorFor("Reason");

    [Fact]
    public void ReasonTooLong_Fails()
        => Validator.ValidateCommand(new CancelOrderCommand(Guid.NewGuid(), new string('x', 501))).ShouldHaveErrorFor("Reason");
}

public class AddOrderNoteCommandValidatorTests
{
    private static readonly AddOrderNoteCommandValidator Validator = new();

    [Fact]
    public void Valid_Passes()
        => Validator.ValidateCommand(new AddOrderNoteCommand(Guid.NewGuid(), "Called customer")).ShouldBeValid();

    [Fact]
    public void EmptyNote_Fails()
        => Validator.ValidateCommand(new AddOrderNoteCommand(Guid.NewGuid(), "")).ShouldHaveErrorFor("Note");

    [Fact]
    public void NoteTooLong_Fails()
        => Validator.ValidateCommand(new AddOrderNoteCommand(Guid.NewGuid(), new string('x', 1001))).ShouldHaveErrorFor("Note");
}

public class UpdateCustomerNotesCommandValidatorTests
{
    private static readonly UpdateCustomerNotesCommandValidator Validator = new();

    [Fact]
    public void Valid_Passes()
        => Validator.ValidateCommand(new UpdateCustomerNotesCommand(Guid.NewGuid(), "VIP")).ShouldBeValid();

    [Fact]
    public void EmptyCustomerId_Fails()
        => Validator.ValidateCommand(new UpdateCustomerNotesCommand(Guid.Empty, "note")).ShouldHaveErrorFor("CustomerId");

    [Fact]
    public void EmptyNote_Fails()
        => Validator.ValidateCommand(new UpdateCustomerNotesCommand(Guid.NewGuid(), "")).ShouldHaveErrorFor("Note");
}

public class SendOrderOtpCommandValidatorTests
{
    private static readonly SendOrderOtpCommandValidator Validator = new();

    [Fact]
    public void Valid_Passes()
        => Validator.ValidateCommand(new SendOrderOtpCommand(Guid.NewGuid(), "QAF-123456")).ShouldBeValid();

    [Fact]
    public void EmptyStoreId_Fails()
        => Validator.ValidateCommand(new SendOrderOtpCommand(Guid.Empty, "QAF-123456")).ShouldHaveErrorFor("StoreId");

    [Fact]
    public void EmptyOrderNumber_Fails()
        => Validator.ValidateCommand(new SendOrderOtpCommand(Guid.NewGuid(), "")).ShouldHaveErrorFor("OrderNumber");
}
