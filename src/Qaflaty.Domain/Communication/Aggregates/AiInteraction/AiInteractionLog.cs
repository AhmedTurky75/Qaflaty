using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Communication.Enums;

namespace Qaflaty.Domain.Communication.Aggregates.AiInteraction;

/// <summary>
/// An append-only analytics record of a single AI assistant interaction within a store.
/// Used to power the merchant AI analytics dashboard (usage, sales influence, knowledge gaps).
/// </summary>
public sealed class AiInteractionLog : AggregateRoot<AiInteractionId>
{
    public StoreId StoreId { get; private set; } // Store the interaction occurred in
    public ChatConversationId ConversationId { get; private set; } // Conversation the interaction is part of
    public AiInteractionType Type { get; private set; } // Kind of interaction: Reply / ProductSuggested / CartAdd / OrderPlaced

    /// <summary>The customer question for <see cref="AiInteractionType.Reply"/> interactions.</summary>
    public string? Query { get; private set; } // Customer's question text (Reply only), truncated to 500 chars

    /// <summary>The product involved for ProductSuggested / CartAdd interactions.</summary>
    public Guid? ProductId { get; private set; } // Product referenced by a suggestion/cart-add interaction

    /// <summary>Number of knowledge documents retrieved (Reply interactions). 0 indicates a knowledge gap.</summary>
    public int DocumentsRetrieved { get; private set; } // RAG documents found for the query; 0 flags a knowledge gap

    public DateTime CreatedAt { get; private set; } // UTC timestamp when the interaction was logged

    private AiInteractionLog() { } // EF Core

    private AiInteractionLog(
        AiInteractionId id,
        StoreId storeId,
        ChatConversationId conversationId,
        AiInteractionType type,
        string? query,
        Guid? productId,
        int documentsRetrieved) : base(id)
    {
        StoreId = storeId;
        ConversationId = conversationId;
        Type = type;
        Query = query;
        ProductId = productId;
        DocumentsRetrieved = documentsRetrieved;
        CreatedAt = DateTime.UtcNow;
    }

    public static AiInteractionLog Reply(
        StoreId storeId, ChatConversationId conversationId, string? query, int documentsRetrieved) =>
        new(AiInteractionId.New(), storeId, conversationId, AiInteractionType.Reply,
            Truncate(query, 500), null, documentsRetrieved);

    public static AiInteractionLog ProductSuggested(
        StoreId storeId, ChatConversationId conversationId, Guid productId) =>
        new(AiInteractionId.New(), storeId, conversationId, AiInteractionType.ProductSuggested,
            null, productId, 0);

    public static AiInteractionLog CartAdd(
        StoreId storeId, ChatConversationId conversationId, Guid productId) =>
        new(AiInteractionId.New(), storeId, conversationId, AiInteractionType.CartAdd,
            null, productId, 0);

    public static AiInteractionLog OrderPlaced(
        StoreId storeId, ChatConversationId conversationId) =>
        new(AiInteractionId.New(), storeId, conversationId, AiInteractionType.OrderPlaced,
            null, null, 0);

    private static string? Truncate(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;
        var trimmed = value.Trim();
        return trimmed.Length <= maxLength ? trimmed : trimmed[..maxLength];
    }
}
