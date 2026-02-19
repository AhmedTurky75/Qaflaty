using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Communication.Entities;
using Qaflaty.Domain.Communication.Enums;

namespace Qaflaty.Domain.Communication.Aggregates.ChatConversation;

public sealed class ChatConversation : AggregateRoot<ChatConversationId>
{
    private readonly List<ChatMessage> _messages = new();

    public StoreId StoreId { get; private set; }
    public StoreCustomerId? CustomerId { get; private set; }
    public string? GuestSessionId { get; private set; }
    public ConversationStatus Status { get; private set; }
    public DateTime StartedAt { get; private set; }
    public DateTime? ClosedAt { get; private set; }
    public DateTime? LastMessageAt { get; private set; }
    public int UnreadMerchantMessages { get; private set; }
    public int UnreadCustomerMessages { get; private set; }

    public IReadOnlyCollection<ChatMessage> Messages => _messages.AsReadOnly();

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

        // Increment unread counter based on sender type
        if (senderType == MessageSenderType.Customer || senderType == MessageSenderType.Bot)
        {
            UnreadMerchantMessages++;
        }
        else if (senderType == MessageSenderType.Merchant)
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
            if (message is not null && (message.SenderType == MessageSenderType.Customer || message.SenderType == MessageSenderType.Bot))
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
            if (message is not null && message.SenderType == MessageSenderType.Merchant)
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
