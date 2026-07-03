using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Aggregates.ChatConversation;
using Qaflaty.Domain.Communication.Enums;
using Xunit;

namespace Qaflaty.UnitTests.Domain.Communication;

public class ChatConversationTests
{
    private static ChatConversation NewGuestConversation() =>
        ChatConversation.Create(StoreId.New(), null, "guest-session-1");

    [Fact]
    public void Create_WithCustomer_IsActive()
    {
        var convo = ChatConversation.Create(StoreId.New(), StoreCustomerId.New(), null);

        Assert.Equal(ConversationStatus.Active, convo.Status);
        Assert.NotNull(convo.CustomerId);
    }

    [Fact]
    public void Create_WithoutCustomerOrGuest_Throws()
    {
        Assert.Throws<ArgumentException>(() =>
            ChatConversation.Create(StoreId.New(), null, null));
    }

    // ---------- Unread counters ----------

    [Fact]
    public void AddCustomerMessage_IncrementsMerchantUnread()
    {
        var convo = NewGuestConversation();

        convo.AddMessage(MessageSenderType.Customer, "cust-1", "Hello");

        Assert.Equal(1, convo.UnreadMerchantMessages);
        Assert.Equal(0, convo.UnreadCustomerMessages);
        Assert.NotNull(convo.LastMessageAt);
    }

    [Fact]
    public void AddMerchantMessage_IncrementsCustomerUnread()
    {
        var convo = NewGuestConversation();

        convo.AddMessage(MessageSenderType.Merchant, "merch-1", "Hi there");

        Assert.Equal(1, convo.UnreadCustomerMessages);
        Assert.Equal(0, convo.UnreadMerchantMessages);
    }

    [Fact]
    public void AddBotMessage_CountsAsCustomerUnread_NotMerchant()
    {
        var convo = NewGuestConversation();

        convo.AddMessage(MessageSenderType.Bot, "Bot", "Auto reply");

        Assert.Equal(1, convo.UnreadCustomerMessages);
        Assert.Equal(0, convo.UnreadMerchantMessages);
    }

    [Fact]
    public void MarkMessagesAsReadByMerchant_ClearsCustomerMessageUnread()
    {
        var convo = NewGuestConversation();
        var msg = convo.AddMessage(MessageSenderType.Customer, "cust-1", "Hello");

        convo.MarkMessagesAsReadByMerchant([msg.Id]);

        Assert.Equal(0, convo.UnreadMerchantMessages);
        Assert.NotNull(msg.ReadAt);
    }

    [Fact]
    public void MarkMessagesAsReadByCustomer_ClearsMerchantAndBotUnread()
    {
        var convo = NewGuestConversation();
        var merchantMsg = convo.AddMessage(MessageSenderType.Merchant, "m", "Hi");
        var botMsg = convo.AddMessage(MessageSenderType.Bot, "Bot", "Auto");

        convo.MarkMessagesAsReadByCustomer([merchantMsg.Id, botMsg.Id]);

        Assert.Equal(0, convo.UnreadCustomerMessages);
    }

    [Fact]
    public void MarkMessagesAsReadByMerchant_IgnoresMerchantOwnMessages()
    {
        var convo = NewGuestConversation();
        var merchantMsg = convo.AddMessage(MessageSenderType.Merchant, "m", "Hi");

        convo.MarkMessagesAsReadByMerchant([merchantMsg.Id]);

        // Merchant reading its own message must not touch the customer-unread counter.
        Assert.Equal(1, convo.UnreadCustomerMessages);
        Assert.Null(merchantMsg.ReadAt);
    }

    // ---------- Lifecycle ----------

    [Fact]
    public void Close_SetsClosedStatusAndTimestamp()
    {
        var convo = NewGuestConversation();

        convo.Close();

        Assert.Equal(ConversationStatus.Closed, convo.Status);
        Assert.NotNull(convo.ClosedAt);
    }

    [Fact]
    public void AddMessage_ToClosedConversation_Throws()
    {
        var convo = NewGuestConversation();
        convo.Close();

        Assert.Throws<InvalidOperationException>(() =>
            convo.AddMessage(MessageSenderType.Customer, "c", "Hello again"));
    }

    [Fact]
    public void AddMessage_ToArchivedConversation_Throws()
    {
        var convo = NewGuestConversation();
        convo.Archive();

        Assert.Throws<InvalidOperationException>(() =>
            convo.AddMessage(MessageSenderType.Customer, "c", "Hello"));
    }

    [Fact]
    public void Reopen_ClosedConversation_BecomesActive()
    {
        var convo = NewGuestConversation();
        convo.Close();

        convo.Reopen();

        Assert.Equal(ConversationStatus.Active, convo.Status);
        Assert.Null(convo.ClosedAt);
    }

    [Fact]
    public void Reopen_ArchivedConversation_StaysArchived()
    {
        var convo = NewGuestConversation();
        convo.Archive();

        convo.Reopen();

        Assert.Equal(ConversationStatus.Archived, convo.Status);
    }
}
