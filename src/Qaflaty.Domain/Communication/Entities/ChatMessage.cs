using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Communication.Enums;

namespace Qaflaty.Domain.Communication.Entities;

public sealed class ChatMessage : Entity<ChatMessageId>
{
    public ChatConversationId ConversationId { get; private set; }
    public MessageSenderType SenderType { get; private set; }
    public string? SenderId { get; private set; } // CustomerId, MerchantId, or "Bot"
    public string Content { get; private set; } = string.Empty;
    public DateTime SentAt { get; private set; }
    public DateTime? ReadAt { get; private set; }

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
