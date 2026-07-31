using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed class CommunicationSettings : ValueObject
{
    public bool WhatsAppEnabled { get; private set; } // Whether the WhatsApp contact button is shown on the storefront
    public string? WhatsAppNumber { get; private set; } // WhatsApp business number used for the chat link, e.g. "+966500000000"
    public string? WhatsAppDefaultMessage { get; private set; } // Pre-filled message text when a customer opens WhatsApp chat, e.g. "Hi, I have a question about..."
    public bool LiveChatEnabled { get; private set; } // Whether the built-in live chat widget (SignalR) is enabled for the store
    public bool AiChatbotEnabled { get; private set; } // Whether the AI chatbot assistant is enabled in live chat
    public string? AiChatbotName { get; private set; } // Display name shown for the AI assistant, e.g. "Qaflaty Assistant"

    private CommunicationSettings() { }

    public static CommunicationSettings CreateDefault() => new()
    {
        WhatsAppEnabled = false,
        LiveChatEnabled = false,
        AiChatbotEnabled = false
    };

    public static CommunicationSettings Create(
        bool whatsAppEnabled, string? whatsAppNumber, string? whatsAppDefaultMessage,
        bool liveChatEnabled, bool aiChatbotEnabled, string? aiChatbotName) => new()
    {
        WhatsAppEnabled = whatsAppEnabled,
        WhatsAppNumber = whatsAppNumber,
        WhatsAppDefaultMessage = whatsAppDefaultMessage,
        LiveChatEnabled = liveChatEnabled,
        AiChatbotEnabled = aiChatbotEnabled,
        AiChatbotName = aiChatbotName
    };

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return WhatsAppEnabled;
        yield return WhatsAppNumber;
        yield return WhatsAppDefaultMessage;
        yield return LiveChatEnabled;
        yield return AiChatbotEnabled;
        yield return AiChatbotName;
    }
}
