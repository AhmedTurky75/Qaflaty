using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Communication.Enums;

namespace Qaflaty.Domain.Communication.Entities;

public sealed class ChatMessage : Entity<ChatMessageId>
{
    public ChatConversationId ConversationId { get; private set; } // Conversation this message belongs to
    public MessageSenderType SenderType { get; private set; } // Who sent it: Customer / Merchant / Bot
    public string? SenderId { get; private set; } // Id of the sender — CustomerId, MerchantId, or "Bot"
    public string Content { get; private set; } = string.Empty; // The message text body
    public DateTime SentAt { get; private set; } // UTC timestamp when the message was sent
    public DateTime? ReadAt { get; private set; } // UTC timestamp when the recipient read it; null while unread

    private ChatMessage() { } // EF Core

    private ChatMessage(
        ChatMessageId id,
        ChatConversationId conversationId,
        MessageSenderType senderType,
        string? senderId,
        string content,
        DateTime sentAt) : base(id)
    {
        ConversationId = conversationId;
        SenderType = senderType;
        SenderId = senderId;
        Content = content;
        SentAt = sentAt;
    }

    public static ChatMessage Create(
        ChatConversationId conversationId,
        MessageSenderType senderType,
        string? senderId,
        string content)
    {
        return new ChatMessage(
            ChatMessageId.New(),
            conversationId,
            senderType,
            senderId,
            content,
            DateTime.UtcNow);
    }

    public void MarkAsRead()
    {
        if (ReadAt is null)
        {
            ReadAt = DateTime.UtcNow;
        }
    }
}
