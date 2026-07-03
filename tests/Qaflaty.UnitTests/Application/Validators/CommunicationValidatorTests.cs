using Qaflaty.Application.Communication.Commands.CloseConversation;
using Qaflaty.Application.Communication.Commands.MarkMessagesAsRead;
using Qaflaty.Application.Communication.Commands.StartConversation;
using Qaflaty.Application.Communication.Queries.GetActiveConversation;
using Qaflaty.Application.Communication.Queries.GetConversationMessages;
using Qaflaty.Application.Communication.Queries.GetConversations;
using Qaflaty.Domain.Communication.Enums;
using Xunit;

namespace Qaflaty.UnitTests.Application.Validators;

public class StartConversationCommandValidatorTests
{
    private static readonly StartConversationCommandValidator Validator = new();

    [Fact]
    public void WithCustomer_Passes()
        => Validator.ValidateCommand(new StartConversationCommand(Guid.NewGuid(), Guid.NewGuid(), null, "Hi")).ShouldBeValid();

    [Fact]
    public void WithGuest_Passes()
        => Validator.ValidateCommand(new StartConversationCommand(Guid.NewGuid(), null, "guest-1", null)).ShouldBeValid();

    [Fact]
    public void EmptyStoreId_Fails()
        => Validator.ValidateCommand(new StartConversationCommand(Guid.Empty, Guid.NewGuid(), null, null)).ShouldHaveErrorFor("StoreId");

    [Fact]
    public void NeitherCustomerNorGuest_Fails()
        => Validator.ValidateCommand(new StartConversationCommand(Guid.NewGuid(), null, null, null)).ShouldBeInvalid();

    [Fact]
    public void InitialMessageTooLong_Fails()
        => Validator.ValidateCommand(new StartConversationCommand(Guid.NewGuid(), null, "guest-1", new string('x', 2001)))
            .ShouldHaveErrorFor("InitialMessage");
}

public class MarkMessagesAsReadCommandValidatorTests
{
    private static readonly MarkMessagesAsReadCommandValidator Validator = new();

    private static MarkMessagesAsReadCommand Valid(List<Guid>? ids = null, MessageSenderType reader = MessageSenderType.Merchant)
        => new(Guid.NewGuid(), ids ?? [Guid.NewGuid()], reader);

    [Fact]
    public void Valid_Passes() => Validator.ValidateCommand(Valid()).ShouldBeValid();

    [Fact]
    public void EmptyConversationId_Fails()
        => Validator.ValidateCommand(Valid() with { ConversationId = Guid.Empty }).ShouldHaveErrorFor("ConversationId");

    [Fact]
    public void NoMessageIds_Fails()
        => Validator.ValidateCommand(Valid(ids: [])).ShouldHaveErrorFor("MessageIds");

    [Fact]
    public void InvalidReaderType_Fails()
        => Validator.ValidateCommand(Valid(reader: (MessageSenderType)99)).ShouldHaveErrorFor("ReaderType");
}

public class CloseConversationCommandValidatorTests
{
    private static readonly CloseConversationCommandValidator Validator = new();

    [Fact]
    public void Valid_Passes()
        => Validator.ValidateCommand(new CloseConversationCommand(Guid.NewGuid())).ShouldBeValid();

    [Fact]
    public void EmptyConversationId_Fails()
        => Validator.ValidateCommand(new CloseConversationCommand(Guid.Empty)).ShouldHaveErrorFor("ConversationId");
}

public class GetConversationsQueryValidatorTests
{
    private static readonly GetConversationsQueryValidator Validator = new();

    [Fact]
    public void Valid_Passes()
        => Validator.ValidateCommand(new GetConversationsQuery(Guid.NewGuid(), 1, 20)).ShouldBeValid();

    [Fact]
    public void EmptyStoreId_Fails()
        => Validator.ValidateCommand(new GetConversationsQuery(Guid.Empty, 1, 20)).ShouldHaveErrorFor("StoreId");

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void NonPositivePageNumber_Fails(int page)
        => Validator.ValidateCommand(new GetConversationsQuery(Guid.NewGuid(), page, 20)).ShouldHaveErrorFor("PageNumber");

    [Theory]
    [InlineData(0)]
    [InlineData(101)]
    public void InvalidPageSize_Fails(int size)
        => Validator.ValidateCommand(new GetConversationsQuery(Guid.NewGuid(), 1, size)).ShouldHaveErrorFor("PageSize");
}

public class GetConversationMessagesQueryValidatorTests
{
    private static readonly GetConversationMessagesQueryValidator Validator = new();

    [Fact]
    public void Valid_Passes()
        => Validator.ValidateCommand(new GetConversationMessagesQuery(Guid.NewGuid())).ShouldBeValid();

    [Fact]
    public void EmptyConversationId_Fails()
        => Validator.ValidateCommand(new GetConversationMessagesQuery(Guid.Empty)).ShouldHaveErrorFor("ConversationId");
}

public class GetActiveConversationQueryValidatorTests
{
    private static readonly GetActiveConversationQueryValidator Validator = new();

    [Fact]
    public void WithCustomer_Passes()
        => Validator.ValidateCommand(new GetActiveConversationQuery(Guid.NewGuid(), Guid.NewGuid(), null)).ShouldBeValid();

    [Fact]
    public void WithGuest_Passes()
        => Validator.ValidateCommand(new GetActiveConversationQuery(Guid.NewGuid(), null, "guest-1")).ShouldBeValid();

    [Fact]
    public void NeitherCustomerNorGuest_Fails()
        => Validator.ValidateCommand(new GetActiveConversationQuery(Guid.NewGuid(), null, null)).ShouldBeInvalid();
}
