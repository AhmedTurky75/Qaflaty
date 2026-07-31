using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Communication.Entities;
using Qaflaty.Domain.Communication.Enums;

namespace Qaflaty.Domain.Communication.Aggregates.ChatConversation;

public sealed class ChatConversation : AggregateRoot<ChatConversationId>
{
    private readonly List<ChatMessage> _messages = new();

    public StoreId StoreId { get; private set; } // Store this conversation belongs to
    public StoreCustomerId? CustomerId { get; private set; } // Logged-in customer in the chat; null for guests
    public string? GuestSessionId { get; private set; } // Guest session identifier when no customer is logged in (exactly one of CustomerId/GuestSessionId is set)
    public ConversationStatus Status { get; private set; } // Conversation state: Active / Closed / Archived
    public DateTime StartedAt { get; private set; } // UTC timestamp when the conversation began
    public DateTime? ClosedAt { get; private set; } // UTC timestamp when it was closed/archived; null while active
    public DateTime? LastMessageAt { get; private set; } // UTC timestamp of the most recent message (for sorting inbox)
    public int UnreadMerchantMessages { get; private set; } // Count of messages the merchant hasn't read yet (from the customer)
    public int UnreadCustomerMessages { get; private set; } // Count of messages the customer hasn't read yet (from the merchant or the AI bot)

    public IReadOnlyCollection<ChatMessage> Messages => _messages.AsReadOnly(); // All messages in the conversation, in send order

    private ChatConversation() { } // EF Core

    private ChatConversation(
        ChatConversationId id,
        StoreId storeId,
        StoreCustomerId? customerId,
        string? guestSessionId,
        DateTime startedAt) : base(id)
    {
        StoreId = storeId;
        CustomerId = customerId;
        GuestSessionId = guestSessionId;
        Status = ConversationStatus.Active;
        StartedAt = startedAt;
        UnreadMerchantMessages = 0;
        UnreadCustomerMessages = 0;
    }

    public static ChatConversation Create(
        StoreId storeId,
        StoreCustomerId? customerId,
        string? guestSessionId)
    {
        if (customerId is null && string.IsNullOrWhiteSpace(guestSessionId))
        {
            throw new ArgumentException("Either CustomerId or GuestSessionId must be provided");
        }

        return new ChatConversation(
            ChatConversationId.New(),
            storeId,
            customerId,
            guestSessionId,
            DateTime.UtcNow);
    }

    public ChatMessage AddMessage(MessageSenderType senderType, string? senderId, string content)
    {
        if (Status == ConversationStatus.Archived)
        {
            throw new InvalidOperationException("Cannot add messages to archived conversations");
        }

        if (Status == ConversationStatus.Closed)
        {
            throw new InvalidOperationException("Cannot add messages to a closed conversation. Start a new conversation instead.");
        }

        var message = ChatMessage.Create(Id, senderType, senderId, content);
        _messages.Add(message);
        LastMessageAt = DateTime.UtcNow;

        // Increment unread counter based on sender type. A Bot message is an AI reply generated
        // for the customer, so — like a Merchant message — it is unread for the customer, not the
        // merchant. Only genuine Customer messages are unread for the merchant.
        if (senderType == MessageSenderType.Customer)
        {
            UnreadMerchantMessages++;
        }
        else if (senderType == MessageSenderType.Merchant || senderType == MessageSenderType.Bot)
        {
            UnreadCustomerMessages++;
        }

        return message;
    }

    public void MarkMessagesAsReadByMerchant(IEnumerable<ChatMessageId> messageIds)
    {
        foreach (var messageId in messageIds)
        {
            var message = _messages.FirstOrDefault(m => m.Id == messageId && m.ReadAt is null);
            if (message is not null && message.SenderType == MessageSenderType.Customer)
            {
                message.MarkAsRead();
                UnreadMerchantMessages = Math.Max(0, UnreadMerchantMessages - 1);
            }
        }
    }

    public void MarkMessagesAsReadByCustomer(IEnumerable<ChatMessageId> messageIds)
    {
        foreach (var messageId in messageIds)
        {
            var message = _messages.FirstOrDefault(m => m.Id == messageId && m.ReadAt is null);
            if (message is not null && (message.SenderType == MessageSenderType.Merchant || message.SenderType == MessageSenderType.Bot))
            {
                message.MarkAsRead();
                UnreadCustomerMessages = Math.Max(0, UnreadCustomerMessages - 1);
            }
        }
    }

    public void Close()
    {
        if (Status == ConversationStatus.Active)
        {
            Status = ConversationStatus.Closed;
            ClosedAt = DateTime.UtcNow;
        }
    }

    public void Archive()
    {
        Status = ConversationStatus.Archived;
        if (ClosedAt is null)
        {
            ClosedAt = DateTime.UtcNow;
        }
    }

    public void Reopen()
    {
        if (Status != ConversationStatus.Archived)
        {
            Status = ConversationStatus.Active;
            ClosedAt = null;
        }
    }
}
